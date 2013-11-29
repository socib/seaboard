#whatever settings you need
import multiprocessing

workers = multiprocessing.cpu_count() * 2 + 1
bind = '127.0.0.1:49153'
max_requests = 5000