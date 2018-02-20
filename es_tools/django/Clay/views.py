import os
import logging
import requests
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse

logger = logging.getLogger('spl.django.service')
headers = {
    'Content-Type': 'application/json'
}

@login_required
def esapi(request):
    logger.info('current working directory:' + os.getcwd())
    logger.info(__file__)
    logger.info(os.path.realpath(__file__))
    method = request.REQUEST['method']
    uri = request.REQUEST['uri']
    data = request.REQUEST['data']
    url = 'http://demo.zettadian.com:29200/' + uri
    try:
        res = requests.get(url=url, headers=headers, data=data, timeout=15 * 60)
    except Exception as e:
        logger.error(e)
        return HttpResponse(e)

    return HttpResponse(res.text)
