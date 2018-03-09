import sys
import json, csv
import requests
import splunk.Intersplunk
import splunk.mining.dcutils as dcu

#
# splunk cmd python .\\es_proxy.py searchargs
# alias splunkc='/home/itian/splunk-7.0.2/bin/splunk cmd python'
#

logger = dcu.getLogger()
json_headers = {'Content-Type': 'application/json'}

def main(argv):
    
    try:
        url = sys.argv[1]
        query = sys.argv[2]
        logger.info('url=' + url)
        logger.info('query=' + query)
        r = requests.get(
            url=url, headers=json_headers, data=query, timeout=15 * 60)
        jo = r.json()

        hits = jo['hits']['hits']

        logger.info(r.text)
        splunk.Intersplunk.outputResults(hits)
        # print hitsValues
        #
    except Exception as e:
        logger.error("error")
        logger.error(e)

if __name__ == '__main__':
    try:
        main(sys.argv)
    except Exception as e:
        logger.error(e)
