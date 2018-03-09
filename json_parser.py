
import re

jsonString = """{
    "took": -0.68,
    "timed_out": false,
    "_shards": {
        "total": 95,
        "successful": 95,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": 26927676,
        "max_score": 1.0,
        "hits": [{
            "_index": "dhcplog-2017.11.01",
            "_type": "logs",
            "_id": "AV_D5mreGjoGZ2rUyadN",
            "_score": 1.0,
            "_source": {
                "@timestamp": "2017-11-01T04:25:32.000Z",
                "active": "0",
                "dhcplog_type": "allocated",
                "dhcp_host": "demo.zettadian.com",
                "allocated": "0"
            }
        }, {
            "_index": "dhcplog-2017.11.01",
            "_type": "logs",
            "_id": "AV_D5m1-GjoGZ2rUyama",
            "_score": 1.0,
            "_source": {
                "@timestamp": "2017-11-01T14:13:29.000Z",
                "active": "7",
                "dhcplog_type": "allocated",
                "dhcp_host": "demo.zettadian.com",
                "allocated": "7"
            }
        }]
    }
}"""


class ValueType:
    value = None
    group = None
    patterns = [r'([.+\-\d]+)\s*,', r'(false|true|null)\s*,', r'(\S+),']

    def __init__(self, jstr):
        self.jstr = jstr

    def parse(self):
        for pattern in self.patterns:
            m = re.match(pattern, self.jstr, re.M)
            if m is not None:
                self.group = m.group()
                self.value = m.group(1)
                return

        if self.jstr[:1] is '{':
            self.value = self.get_object_str('{', '}')
            self.group = self.value
            return

        if self.jstr[:1] is '[':
            (lst, lst_group) = self.get_object_str('[', ']')
            self.value = ''.join(lst)
            self.group = ''.join(lst + lst_group)
            return

    def get_object_str(self, delim1, delim2):
        count = 0
        lst = []
        lst_group = []
        found = False
        for ch in self.jstr:
            if found == False:
                lst.append(ch)
            else:
                lst_group.append(ch)
                if ch == ',':
                    break
            if ch == delim1:
                count = count + 1
            elif ch == delim2:
                count = count - 1
            if count == 0:
                found = True

        return (lst, lst_group)

    def get_value(self):
        return self.value

    def get_group(self):
        return self.group


class ObjectType:
    lst = []

    def __init__(self, jstr):
        self.jstr = jstr

    def update_template(self, jstr):
        self.jstr = self.jstr[len(jstr):]
        self.jstr = self.jstr.lstrip(' \t\n\r')
        print '========='
        print jstr
        print '>>>>>>'
        print self.jstr

    def parse(self):
        m = re.match(r'^{[\n|\r|\s]+([\s\S]+)}$', self.jstr, re.M)
        if m is not None:
            self.jstr = m.group(1)
        self.traverse()

    def traverse(self):
        key = self.get_name()
        if key is None:
            return
        val = self.get_value()
        self.lst.append({key: val})
        self.traverse()

    def get_name(self):
        m = re.match(r'"(\w+)"[\n|\r|\s]*:[\n|\r|\s]*', self.jstr, re.M)
        if m is not None:
            self.update_template(m.group())
            return m.group(1)
        else:
            return None

    def get_value(self):
        o = ValueType(self.jstr)
        o.parse()
        val = o.get_value()
        group = o.get_group()
        if group is not None:
            self.update_template(group)
        return val


x = ObjectType(jsonString)
x.parse()
