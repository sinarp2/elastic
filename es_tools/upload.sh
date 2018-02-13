DEV_HOME=/Users/dosungnoh/Documents/GitHub/elastic/es_tools
sshpass -p '1111' scp $DEV_HOME/appserver/static/js/es_console/app.js dnoh@vbox-203:~/splunk/etc/apps/es_tools/appserver/static/js/es_console
sshpass -p '1111' scp $DEV_HOME/django/es_tools/views.py dnoh@vbox-203:~/splunk/etc/apps/es_tools/django/es_tools/