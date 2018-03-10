import re
import collections

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
    _pattern = [r'([.+\-\d]+)\s*,', r'(false|true|null)\s*,', r'(\S+),']

    def __init__(self, jstr):
        self._jstr = jstr
        self._value = None
        self._group = None
        self._valueType = None
        self._parse()

    def _parse(self):
        for pattern in self._pattern:
            m = re.match(pattern, self._jstr, re.M)
            if m is not None:
                self._group = m.group()
                self._value = m.group(1)
                self._valueType = 'flat'
                return

        if self._jstr[:1] is '{':
            (lst, lst_group) = self.get_object_str('{', '}')
            self._value = ''.join(lst)
            self._group = ''.join(lst + lst_group)
            self._valueType = 'dict'
            return

        if self._jstr[:1] is '[':
            (lst, lst_group) = self.get_object_str('[', ']')
            self._value = ''.join(lst)
            self._group = ''.join(lst + lst_group)
            self._valueType = 'array'
            return

    def get_object_str(self, delim1, delim2):
        count = 0
        lst = []
        lst_group = []
        found = False
        for ch in self._jstr:
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
        return self._value

    def get_group(self):
        return self._group

    def get_type(self):
        return self._valueType

class BaseType(object):

    def update_template(self, jstr):
        self._jstr = self._jstr[len(jstr):]
        self._jstr = self._jstr.lstrip(' \t\n\r')

class ObjectType(BaseType):
    def __init__(self, jstr):
        self._dict = collections.OrderedDict()
        self._jstr = jstr
        self._parse()

    def _parse(self):
        m = re.match(r'^{[\n|\r|\s]+([\s\S]+)}$', self._jstr, re.M)
        if m is not None:
            self._jstr = m.group(1)
        self.traverse()

    def traverse(self):
        key = self.get_name()
        if key is None:
            return
        val = self.get_value()
        self._dict[key] = val
        self.traverse()

    def get_name(self):
        m = re.match(r'"(\w+)"[\n|\r|\s]*:[\n|\r|\s]*', self._jstr, re.M)
        if m is not None:
            BaseType.update_template(self, m.group())
            return m.group(1)
        else:
            return None

    def get_value(self):
        o = ValueType(self._jstr)
        val = o.get_value()
        group = o.get_group()
        valType = o.get_type()
        if group is not None:
            BaseType.update_template(self, group)

        if valType == 'dict':
            o = ObjectType(val)
            val = o.get_dict()
        if valType == 'array':
            a = ArrayType(val)
            val = a.get_list()

        return val

    def get_dict(self):
        return self._dict


class ArrayType(BaseType):

    def __init__(self, jstr):
        BaseType.__init__(self)
        self._jstr = jstr.strip(' \t\n\r')
        self._list = []
        self._parse()

    def _parse(self):
        m = re.match(r'^[[\n|\r|\s]+([\s\S]+)]$', self._jstr, re.M)
        if m is not None:
            self._jstr = m.group(1)
        self.traverse()

    def traverse(self):
        val = self.get_value()
        if val is None:
            return
        self._list.append(val)
        self.traverse()

    def get_value(self):
        o = ValueType(self._jstr)
        if o is None:
            return None
        val = o.get_value()
        group = o.get_group()
        valType = o.get_type()
        if group is not None:
            BaseType.update_template(self, group)

        if valType == 'dict':
            o = ObjectType(val)
            val = o.get_dict()
        if valType == 'array':
            a = ArrayType(self._jstr)
            val = a.get_list()

        return val

    def get_list(self):
        return self._list


x = ObjectType(jsonString)
dic = x.get_dict()


od = dic['hits']['hits']

for item in od:
    print item