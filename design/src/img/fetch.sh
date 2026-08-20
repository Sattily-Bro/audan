#!/bin/zsh
# Скачивание моковых фото для прототипа Audan.kz
# U <name> <unsplash-id>  |  L <name> <flickr-tags> <lock>
cd "$(dirname "$0")"
U(){ curl -sL -o "$1.jpg" "https://images.unsplash.com/photo-$2?w=640&q=55&fm=jpg&fit=crop" && echo "U $1 $(stat -f%z $1.jpg)"; }
L(){ curl -sL -o "$1.raw.jpg" "https://loremflickr.com/672/504/$2/all?lock=$3" \
  && sips -c 456 636 "$1.raw.jpg" --out "$1.jpg" >/dev/null 2>&1 && rm "$1.raw.jpg" && echo "L $1 $(stat -f%z $1.jpg)"; }

# --- авто ---
L car-camry    toyota,camry 1
L car-camry2   toyota,camry 7
L car-camry3   toyota,camry 12
L car-camry4   camry,interior 3
L car-accent   hyundai,accent 2
L car-vaz      lada,samara 4
L car-gazelle  gazel,truck 1
L car-prado    toyota,landcruiser 5
L car-parts    car,engine 2
# --- товары ---
U house        1568605114967-8130f3a36994
U house2       1570129477492-45c003edd2be
L bunkbed      bunk,bed 2
L tvstand      tv,cabinet 1
U sofa         1555041469-a586c61ea9bc
L phone        xiaomi,smartphone 3
L washer       washing,machine 1
U jacket       1551028719-00167b16eac5
L tractor      tractor 6
L excavator    excavator 2
# --- скот ---
L sheep1       sheep,flock 3
L sheep2       sheep 8
U horse1       1553284965-83fd3e82fa5a
L horse2       horse,steppe 2
L cow1         cattle,cow 5
L goat         goat 4
# --- еда ---
L lagman       lagman 1
L shashlik     shashlik 2
L shurpa       shurpa 1
L manty        manti,dumplings 1
L samsa        samsa 1
L plov         plov 2
L doner        doner,kebab 3
U tea          1544787219-7f47ccb76574
L compote      compote 1
U dessert      1578985545062-69928b1d9587
L fish         grilled,fish 2
U pizza        1513104890138-7c749659a591
U burger       1568901346375-23c9450c58cd
U bread        1509440159596-0249088772ff
# --- заведения / объекты ---
U rest1        1517248135467-4c7edcad34c4
U cafe1        1554118811-1e0d58224f24
L teahouse     teahouse 2
U grocery      1542838132-92c53300491e
L pharmacy     pharmacy 3
U gas          1545558014-8692077e9b5c
U salon        1560066984-138dadb4c035
L bazaar       bazaar,market 5
# --- stories / пейзажи ---
L steppe       steppe,kazakhstan 1
U mountains    1506905925346-21bda4d32df4
U field        1500382017468-9049fed747ef
U park         1441974231531-c6227db76b6e
L station      railway,station 7
L horses       horses,steppe 3
L kzcity       kazakhstan,city 2
L industrial   factory,construction 4
L canal        irrigation,canal 1
echo DONE
# --- карта: галереи мест (ревью 20.08) ---
U salon2     1560066984-138dadb4c035
U salon3     1585747860715-2ba37e788b70
U manicure   1604654894610-df63bc536371
U pharmacy2  1587854692152-cbe660dbde88
U pharmacy3  1576602976047-174e57a47881
U pharmacy4  1471864190281-a93a3070b6de
U carwash    1607860108855-64acf2078ed9
U gas2       1527018601619-a508a2be00cd
U shelves    1578916171728-46686eac8d58
