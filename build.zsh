#!/usr/bin/zsh

rm -rf builddir
mkdir builddir

codedirs=('lib' 'handlers' )


for d in $codedirs; do
    for f in $d/*; do
#        dirs+=$f
        echo $f
        npx @redneckz/slice-node-modules -e $f --exclude 'aws-*' --zip temp.zip
        unzip -n  -q temp.zip -d builddir
        cd builddir
        zip -r -u incan.zip * 
        cd ..

    done
done

mv builddir/incan.zip .


