import logging, os, ConfigParser
import requests
import splunk.mining.dcutils as dcu
import splunk.appserver.mrsparkle.controllers as controllers
from splunk.appserver.mrsparkle.lib.decorators import expose_page

logger = dcu.getLogger()


class estools(controllers.BaseController):

    json_headers = {
        'Content-Type': 'application/json'
    }

    def __init__(self):
        self.inipath = os.path.join(
            os.environ["SPLUNK_HOME"], "etc", "apps", "Clay", "appserver", "controllers", 'estools.ini')
        self.config = ConfigParser.ConfigParser()
        self.config.read(self.inipath)

    @expose_page(must_login=True, methods=['GET'])
    def esapi(self, **kwargs):
        if 'method' not in kwargs:
            return self.render_json({'error': '"method" parameter not found'})
        if 'uri' not in kwargs:
            return self.render_json({'error': '"uri" parameter not found'})

        method = kwargs['method']
        uri = kwargs['uri']
        data = kwargs['data']
        url = 'http://demo.zettadian.com:29200/' + uri

        try:
            res = requests.get(
                url=url, headers=self.json_headers, data=data, timeout=15 * 60)
        except Exception as e:
            logger.error(e)
            return self.render_json({'error': e})

        return self.render_json(res.text)

    @expose_page(must_login=True, methods=['GET'])
    def get_eshost(self, **kwargs):
        return self.render_json({'host' : self.config.get('elastic', 'host')})

    @expose_page(must_login=True, methods=['POST'])
    def set_eshost(self, **kwargs):
        if 'host' not in kwargs:
            return self.render_json({'error': '"host" parameter not found'})

        self.config.set('elastic', 'host', kwargs['host'])
        with open(self.inipath, "wb") as f:
			self.config.write(f)

        return self.render_json({'OK' : 'Saved!'})
