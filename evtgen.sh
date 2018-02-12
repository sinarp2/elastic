#!/bin/bash
UDP=""
INTERVAL="1"
POSITIONAL=()
while [[ $# -gt 0 ]]
do
    key="$1"
    case $key in
        -u)
        UDP="$1"
        shift # past value
        ;;
        -h)
        HOST="$2"
        shift # past argument
        shift # past value
        ;;
        -p)
        PORT="$2"
        shift # past argument
        shift # past value
        ;;
        -i)
        INTERVAL="$2"
        shift # past argument
        shift # past value
        ;;
        *)    # unknown option
        POSITIONAL+=("$1") # save it in an array for later
        shift # past argument
        ;;
    esac
done
set -- "${POSITIONAL[@]}" # restore positional parameters

if [ -z $HOST ] || [ -z $PORT ];then
    echo 'Usage: sh evtgen.sh weblog-sample.log -u -h 0.0.0.0 -p 9901 -i .1'
    exit 1
fi

echo "cat $1 | nc $UDP $HOST $PORT"

while true; do
    while IFS='' read -r line || [[ -n "$line" ]]; do
        now=$(date +"%d/%b/%Y:%H:%M:%S +0000")
        # 첫 번 째 컬럼의 날짜시간을 실 시간 날짜시간으로 변경한다. - 첫 번 째 컬럼이 오직 날짜시간인 경우에만 해당
        echo "$line" | sed -e "s,\([0-9]\)\{2\}\/\([a-zA-Z]\)\{3\}\/\([0-9]\)\{4\}\:\([0-9]\)\{2\}\:\([0-9]\)\{2\}\:\([0-9]\)\{2\} +0000,${now}," | nc $UDP $HOST $PORT
        sleep $INTERVAL
    done < "$1"
done