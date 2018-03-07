import sys
import json, csv
import requests
import splunk.Intersplunk
import splunk.mining.dcutils as dcu

logger = dcu.getLogger()


def main():


    (isgetinfo, sys.argv) = splunk.Intersplunk.isGetInfo(sys.argv)
    if isgetinfo:
        logger.info('isGetinfo', isgetinfo)
        splunk.Intersplunk.outputInfo (
            streaming=False,
            generating=False,
            retevs=False,
            reqsop=False,
            preop=None,
            timeorder=True,
            clear_req_fields=False,
            req_fields=None
        )
        sys.exit(0)

    json_headers = {
        'Content-Type': 'application/json'
    }

    try:

        param = {
            'method': sys.argv[1],
            'uri': sys.argv[2],
            "data": "{ \"query\": { \"match_all\": {} }}"
        }

        logger.info(param)

        r = requests.get(url='http://demo.zettadian.com:29200/' + sys.argv[2],
                       headers=json_headers, params=sys.argv[3], timeout=15 * 60)

        logger.info('url : ' + r.url)
        logger.info('result' + r.text)
        # jo = r.json()

        # splunk.Intersplunk.outputResults(jo["hits"]["hits"])

    except Exception as e:
        logger.error("error")
        logger.error(e)


if __name__ == '__main__':
    main()
