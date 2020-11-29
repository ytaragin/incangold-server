#!/usr/bin/zsh


codedirs=('lib' 'handlers' )


for d in $codedirs; do
    zip -u incan.zip $d/*.js 
done



