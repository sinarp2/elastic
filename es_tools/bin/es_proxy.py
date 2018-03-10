import sys
import json, csv
import requests
from collections import OrderedDict
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
        
        # d = r.json(object_pairs_hook=OrderedDict)
        j = r.json()

        buckets = j['aggregations']['count_by_timestamp']['buckets']

        logger.info(buckets)
        splunk.Intersplunk.outputResults(buckets)
        # count = 0
        # for item in buckets:
        #     if count == 0:
        #         splunk.Intersplunk.outputResults(','.join(str(x) for x in item.keys()))
        #     splunk.Intersplunk.outputResults(','.join(str(x) for x in item.values()))
        #     count = count + 1

        # logger.info(csvlist)
        # for key, value in d.items():
        #     logger.info(key)
        # splunk.Intersplunk.outputResults(csvlist)
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
