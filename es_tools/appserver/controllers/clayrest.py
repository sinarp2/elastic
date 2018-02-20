# Copyright (C) 2005-2016 Splunk Inc. All Rights Reserved.
#Core Python Imports
import sys, os, csv, json
import ConfigParser
import traceback
import requests
from requests.auth import HTTPDigestAuth
import logging, logging.handlers
from httplib2 import ServerNotFoundError
import socket, time
import base64

#CherryPy Web Controller Imports 
import cherrypy
import splunk.appserver.mrsparkle.controllers as controllers
from splunk.appserver.mrsparkle.lib.decorators import expose_page
from splunk.appserver.mrsparkle.lib.routes import route
from splunk.appserver.mrsparkle.lib.util import make_splunkhome_path

#Splunkd imports
import splunk
import splunk.rest as rest
import splunk.util as util
import lxml.etree as et
from splunk.models.app import App

#Imports
sys.path.append(make_splunkhome_path(["etc", "apps", "Clay", "bin"]))


#CONSTANTS
REST_ROOT_PATH = "/services"
APP_NAME = "Clay"
CSV_FILE = "clay_rest_info.csv"
CSV_PATH = os.path.join(os.environ["SPLUNK_HOME"], "etc", "apps", APP_NAME ,"appserver","controllers",CSV_FILE)
INI_SECTION = "elastic"
INI_FILE = "config.ini"
INI_PATH = os.path.join(os.environ["SPLUNK_HOME"], "etc", "apps", APP_NAME,"bin",INI_FILE)
REST_INI_SECTION = "clayRest"
REST_INI_FILE = "restconfig.ini"
REST_INI_PATH = os.path.join(os.environ["SPLUNK_HOME"], "etc", "apps", APP_NAME,"appserver","controllers",REST_INI_FILE)

SECRET_KEY ="XYZZ"
LOGGER_FILENAME = "es.log"	
LOGGER_MAXBYTES = "52428800"	
LOGGER_BACKUPCOUNT = "5"	

def setupLogger(logger=None, log_format="%(asctime)s %(levelname)s ["+APP_NAME+"] %(message)s", level=logging.INFO, log_name=APP_NAME+".log", logger_name=APP_NAME):
	"""
	Setup a logger suitable for splunkd consumption
	"""
	if logger is None:
		logger = logging.getLogger(logger_name)
	
	logger.propagate = False # Prevent the log messages from being duplicated in the python.log file
	logger.setLevel(level)
	
	file_handler = logging.handlers.RotatingFileHandler(make_splunkhome_path(["var", "log", "splunk", log_name]), maxBytes=2500000, backupCount=5)
	formatter = logging.Formatter(log_format)
	file_handler.setFormatter(formatter)
	
	logger.handlers = []
	logger.addHandler(file_handler)
	
	return logger

def getRemoteSessionKey(username, password, hostPath):
	'''
	Get a remote session key from the auth system
	If fails return None
	'''
	uri = splunk.mergeHostPath(hostPath) + "/services/auth/login"
	args = {"username": username, "password": password }
	try:
		serverResponse, serverContent = splunk_rest_equest(uri, postargs=args)
	except splunk.AuthenticationFailed:
		return None
	
	if serverResponse.status != 200:
		logger.error("getRemoteSessionKey - unable to login; check credentials")
		rest.extractMessages(et.fromstring(serverContent))
		return None

	root = et.fromstring(serverContent)
	sessionKey = root.findtext("sessionKey")
	
	return sessionKey

logger = setupLogger()
splunk.setDefault()
local_host_path = splunk.mergeHostPath()

def readRestConfigForCsv():
	path = CSV_PATH
	conf = [];
	f =  open(path, "r")
	try:
		info_file = csv.reader(f)
		for line in info_file:
			conf = line
	except :
		logger.error('file=clayrest.py, msg=Read clay_rest_info.csv Error')
		stack =  traceback.format_exc()
		logger.error(stack)
	finally:
		f.close()

	return conf;


def writeRestConfigIni(config):
	try:
		path = REST_INI_PATH
		conf = ConfigParser.RawConfigParser()
		conf.add_section(REST_INI_SECTION)
		conf.set(REST_INI_SECTION,"rest_ip_list",config["rest_ip_list"])
		conf.set(REST_INI_SECTION,"rest_port",config["rest_port"])
		conf.set(REST_INI_SECTION,"rest_protocol",config["rest_protocol"])
		conf.set(REST_INI_SECTION,"rest_username",config["rest_username"])
		conf.set(REST_INI_SECTION,"rest_password",config["rest_password"])
		with open(path,"wb") as confFile:
			conf.write(confFile)
	except:
		logger.error('file=clayrest.py, msg=Write Rest Config.ini Error')
		stack = traceback.format_exc()
		logger.error(stack)

def readRestConfigIni():
	try:
		path = REST_INI_PATH
		result = {};
		conf = ConfigParser.ConfigParser()
		conf.read(path)
		result["rest_ip_list"] 	= conf.get(REST_INI_SECTION,"rest_ip_list")
		result["rest_port"] 	= conf.get(REST_INI_SECTION,"rest_port")
		result["rest_protocol"] = conf.get(REST_INI_SECTION,"rest_protocol")
		result["rest_username"] = conf.get(REST_INI_SECTION,"rest_username")
		result["rest_password"] = conf.get(REST_INI_SECTION,"rest_password")
		return result
	except:
		logger.error('file=clayrest.py, msg=Read Rest config.ini Error')
		stack = traceback.format_exc()
		logger.error(stack)
		result = {};
		result["rest_ip_list"] 	= ''
		result["rest_port"] 	= '3868'
		result["rest_protocol"] = 'https'
		result["rest_username"] = 'admin'
		result["rest_password"] = 'u8W705g='
		return result


def writeConfigIni(config):
	try:
		path = INI_PATH
		conf = ConfigParser.RawConfigParser()
		conf.add_section(INI_SECTION)
		conf.set(INI_SECTION,"username",config["username"])
		conf.set(INI_SECTION,"password",config["password"])
		conf.set(INI_SECTION,"clay_server",config["clay_server"])
		conf.set(INI_SECTION,"clay_protocol",config["clay_protocol"])
		conf.set(INI_SECTION,"logger_level",config["logger_level"])
		conf.set(INI_SECTION,"logger_filename",LOGGER_FILENAME)
		conf.set(INI_SECTION,"logger_directory",config["logger_directory"])
		conf.set(INI_SECTION,"logger_maxBytes",LOGGER_MAXBYTES)
		conf.set(INI_SECTION,"logger_backupCount",LOGGER_BACKUPCOUNT)
		with open(path,"wb") as confFile:
			conf.write(confFile)
	except:
		logger.error('file=clayrest.py, msg=Write config.ini Error')
		stack = traceback.format_exc()
		logger.error(stack)

def readConfigIni():
	try:
		path = INI_PATH
		result = {};
		conf = ConfigParser.ConfigParser()
		conf.read(path)
		result["logger_level"] = conf.get(INI_SECTION,"logger_level")
		result["logger_directory"] = conf.get(INI_SECTION,"logger_directory")
		return result
	except:
		logger.error('file=clayrest.py, msg=Read config.ini Error')
		stack = traceback.format_exc()
		logger.error(stack)
		result = {};
		result["logger_level"] = 'NONE'
		result["logger_directory"] = '/'
		return result
								
def encode(key, clear):								
    enc = []								
    for i in range(len(str(clear))):								
        key_c = key[i % len(key)]								
        enc_c = chr((ord(clear[i]) + ord(key_c)) % 256)								
        enc.append(enc_c)								
    return base64.urlsafe_b64encode("".join(enc))								
								
def decode(key, enc):								
    dec = []								
    enc = base64.urlsafe_b64decode(str(enc))								
    for i in range(len(enc)):								
        key_c = key[i % len(key)]								
        dec_c = chr((256 + ord(enc[i]) - ord(key_c)) % 256)								
        dec.append(dec_c)								
    return "".join(dec)									



def sendReq (args):
	temp_url = ''
	temp_param = {}
	try:
		restConf = readRestConfigIni()
		if "rest_ip" in args.keys():
			ip 	= args['rest_ip']
		else:
			ip 	= restConf['rest_ip_list'].split(';')[0]
		
		port 	= restConf['rest_port']
		protocol= restConf['rest_protocol']
		id 		= restConf['rest_username']
		pwd 	= decode(SECRET_KEY, restConf['rest_password'])
		restUrl = protocol+"://"+str(ip)+":"+str(port)+"/"
		
		datas = {}
		
		for key_name, key_value in args.items():
			if key_name == "url" :
				restUrl += key_value
				continue
			elif key_name == "rest_ip" :
				continue
				
			datas[key_name] = key_value
			
		logger.info(datas)	
		logger.info("file=clayrest.py, msg=Python - Send REST Success, url="+restUrl+', param='+json.dumps(datas, ensure_ascii=False))
		temp_url = restUrl
		temp_param = datas
		socket.setdefaulttimeout(10)
		response =requests.post(restUrl, auth=HTTPDigestAuth(id, pwd), data=json.dumps(datas), stream=True, verify=False)
		logger.error(response);
		return json.loads(response.text)
	except:
		logger.error('file=clayrest.py, msg=Python - Send REST Error, url='+temp_url+', param='+json.dumps(temp_param, ensure_ascii=False))
		stack = traceback.format_exc()
		logger.error(stack)
		response = {'ok':'false','error':'Python - Send REST Error'}
		return response


class clayrest(controllers.BaseController):
	
	@expose_page(must_login=False)
	def sendClayConfig(self, **kwargs):
		logger.info("sendClayConfig Start")
		params = {}
		conf = {}
		for key_name, key_value in kwargs.items():
			if key_name.find("password") != -1:
				value = encode(SECRET_KEY,key_value)
			else:
				value = str(key_value)
			
			if (key_name =="username" or key_name =="password" or key_name =="clay_server" 
			or key_name =="clay_protocol" or key_name =="logger_level" or key_name =="logger_directory" ):
				conf[key_name] = value
			
			if key_name !="logger_level" or key_name !="logger_level":
				params[key_name] = value
			
		writeConfigIni(conf)	
		
		response = sendReq(params)
		logger.info("sendClayConfig End")
		return self.render_json(response)
	
	@expose_page(must_login=False)
	def receiveClayConfig(self, **kwargs):
		logger.info("receiveClayConfig Start")
		response = sendReq(kwargs)
		response.update(readConfigIni())
		response["password"] = decode(SECRET_KEY,response["password"])
		response["es_password"]= decode(SECRET_KEY,response["es_password"])
		logger.info("receiveClayConfig End")
		return self.render_json(response)
	
	@expose_page(must_login=False)
	def sendRest(self, **kwargs):
		logger.info("sendRest Start")
		response = sendReq(kwargs)
		logger.info("sendRest End")
		return self.render_json(response)

	@expose_page(must_login=False)
	def getRestConfig(self, **kwargs):
		logger.info("getRestConfig Start")
		
		result = {}
		result = readRestConfigIni()
		logger.info(result)
		result['rest_password'] = decode(SECRET_KEY,result["rest_password"])
		result['ok'] = 'true'
		
		logger.info("getRestConfig End")
		return self.render_json(result)
	
	@expose_page(must_login=False)
	def setRestConfig(self, **kwargs):
		logger.info("setRestConfig Start")
		conf = {}
		for key_name, key_value in kwargs.items():
			if key_name.find("password") != -1:
				value = encode(SECRET_KEY,key_value)
			else:
				value = key_value	
			conf[key_name] = value	
		
		
		writeRestConfigIni(conf)
		
		
		logger.info("setRestConfig End")
		return self.render_json({'ok':'true'})
	@expose_page(must_login=False)
	def getRestIpList(self, **kwargs):
		logger.info("getRestConfig Start")
		
		conf = {}
		conf = readRestConfigIni()
		result={}
		result['rest_ip_list'] = conf["rest_ip_list"]
		result['ok'] = 'true'
		
		logger.info("getRestConfig End")
		return self.render_json(result)