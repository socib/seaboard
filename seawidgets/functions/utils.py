import datetime
from dateutil import tz
import imghdr


# IMAGE AND PATH FUNCTIONS
def isimage(path):
    try:
        return imghdr.what(path)    
    except Exception, e:
        return False

# DATE FUNCTIONS
def unix_time(dt):
    epoch = datetime.datetime.utcfromtimestamp(0)
    delta = dt - epoch
    return delta.total_seconds()

def unix_time_millis(dt):
    return unix_time(dt) * 1000.0

def utc_to_local(dt):
    local = tz.tzlocal()
    UTC = tz.gettz('UTC')
    dt = dt.replace(tzinfo=UTC)
    return dt.astimezone(local)

def strftime_from_millis(milis,format='%d/%m/%Y %H:%M'):    
    epoch = utc_to_local(datetime.datetime.utcfromtimestamp(milis/1000.0))
    return epoch.strftime(format)    
