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

def stripValues(hitsList):
    lst = []
    for dic in hitsList:
        lst.append(dic.values())
    return lst

def main(argv):

    (isgetinfo, sys.argv) = splunk.Intersplunk.isGetInfo(sys.argv)
    if isgetinfo:
        logger.info('isGetinfo', isgetinfo)
        splunk.Intersplunk.outputInfo(
            streaming = False,
            generating = False,
            retevs = False,
            reqsop = False,
            preop = None,
            timeorder = True,
            clear_req_fields = False,
            req_fields = None)
    
    results,unused1,unused2 = splunk.Intersplunk.getOrganizedResults()
    # logger.info(results)
    try:
        
        logger.info(sys.argv)
        url = sys.argv[1][1:-1]
        query = sys.argv[2][1:-1]
        logger.info('url=' + url)
        logger.info('query=' + query)
        r = requests.get(
            url=url, headers=json_headers, data=query, timeout=15 * 60)
        jo = r.json()
        # decoder = json.JSONDecoder(object_pairs_hook=collections.OrderedDict)
        # dic = decoder.decode(r.text)
        # hitsLst = json.loads(json.dumps(dic['hits']['hits']))
        # logger.info(dic['hits']['hits'])
        # arr = []
        # arr.append({
        #     '_time': '1520398021',
        #     '_row': '2001:2::4c2a:1d9b:c8f0:c540'
        # })
        # arr.append({
        #     '_time': '1520398021',
        #     '_row': '2001:2::4c2a:1d9b:c8f0:c540'
        # })
        # arr.append({
        #     '_time': '1520398021',
        #     '_row': '2001:2::4c2a:1d9b:c8f0:c540'
        # })

        # writer = csv.DictWriter(sys.output, fields)

        hits = jo['hits']['hits']
        lst = []
        for d in hits:
            el = {
                "_time": d['_score']['@timestamp'],
                '_index': d['_index'],
                '_type': d['_type'],
                '_id': d['_id'],
                '_score': d['_score']
            }
            # logger.info(el)
            lst.append(el)

        logger.info(lst)
        splunk.Intersplunk.outputResults(hits)

        # print hitsValues

    except Exception as e:
        logger.error("error")
        logger.error(e)


if __name__ == '__main__':
    try:
        main(sys.argv)
    except Exception as e:
        logger.error(e)
