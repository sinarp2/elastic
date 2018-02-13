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
    method = request.REQUEST['method']
    uri = request.REQUEST['uri']
    data = request.REQUEST['data']
    url = 'http://localhost:9200/' + uri
    try:
        res = requests.get(url=url, headers=headers, data=data, timeout=15 * 60)
        logger.info('request query', res)
    except Exception as e:
        logger.error(e)

    return HttpResponse(res.text)
