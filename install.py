#!/usr/bin/python
import sys
from subprocess import Popen, call

# Please run sudo -s before this script.
if __name__=="__main__":
    apt_commands=['ipython',
                  'git',
                  'git-doc',
                  'git-core',
                  'git-gui',
                  'python-django',
                  'python-setuptools',
                  'python-numpy',
                  'python-scipy',
                  'python-matplotlib',
                  'python-dev',
		  'pyton-psycopg2',
                  'vim',
                  'subversion',
		  #'postgresql',
                  ]
    easy_commands=['simplejson','stompservice','orbited']
    
    for command in apt_commands:
        s='apt-get -y install %s'%(command,)
        print s
        call(s,shell=True)
        #Popen(['apt-get','install','-y',command])
    
    call('easy_install pip',shell=True)
    call('easy_install openopt', shell=True)
    #call('wget http://trac.openopt.org/openopt/changeset/latest/PythonPackages?old_path=%2F&format=zip',shell=True)
    call('svn co svn://openopt.org/PythonPackages OOSuite',shell=True)
    call('cd OOSuite; python install_all.py; cd ..',shell=True)
    for command in easy_commands:
        call('pip install %s'%(command,),shell=True)

#NOTE: Also install matplotlib and download and install natgrid (https://github.com/matplotlib/natgrid)
