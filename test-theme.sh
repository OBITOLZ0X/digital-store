#!/bin/bash
# Verify new homepage sections + settings + product slider data flow (local)
cd "C:/Users/louzd/Documents/Visual studio code/Python/Test/Web site for sell/digital-store"
source .env.local
J="curl -s -c /tmp/th.txt -b /tmp/th.txt -H Content-Type:application/json"
BASE="http://localhost:3111"
sleep 4

echo "== login =="
$J -X POST -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" $BASE/api/admin/auth/login

echo
echo "== patch settings: hero + section order/visibility =="
$J -X PATCH -d '{"siteName":"CineFlow","currency":"DZD","heroBadge":"PREMIUM STREAMING & DIGITAL GOODS","heroTitle":"Your Ultimate |Cinema Experience|, Anywhere.","heroSubtitle":"Live sports, blockbuster movies, premium series and global subscriptions — delivered personally in chat.","heroCtaText":"View Plans","heroImages":["https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1600&q=80","https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&q=80"],"sections":[{"key":"categories","title":"A world without limits","visible":true,"sort":2},{"key":"featured","title":"Trending Now","visible":true,"sort":1},{"key":"popular","title":"Popular","visible":false,"sort":3},{"key":"newest","title":"Just Added","visible":true,"sort":4},{"key":"howitworks","title":"How it works","visible":true,"sort":5}]}' $BASE/api/admin/settings | head -c 200
echo

echo "== create category + product with 3 images =="
CATID=$($J -X POST -d '{"name":"IPTV"}' $BASE/api/admin/categories | python -c "import sys,json; print(json.load(sys.stdin)['category']['id'])")
IMGS='["https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=600&q=80","https://images.unsplash.com/photo-1593359677879-a4bb92f367d8?w=600&q=80","https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&q=80"]'
$J -X POST -d "{\"name\":\"IPTV Premium\",\"category_id\":\"$CATID\",\"is_featured\":true,\"has_variants\":true,\"variants\":[{\"name\":\"1 Month\",\"duration_days\":30,\"price\":1500},{\"name\":\"12 Months\",\"duration_days\":365,\"price\":9000}],\"images\":$IMGS}" $BASE/api/admin/products > /dev/null && echo "product created"

echo "== homepage renders: sections order/visibility/theme =="
curl -s $BASE/ -o home.html
echo "Trending Now first?: $(python -c "
import io,re
h=io.open('home.html',encoding='utf-8',errors='replace').read()
i1=h.find('Trending Now'); i2=h.find('A world without limits'); i3=h.find('Just Added')
print('yes' if 0<i1<i2<i3 else f'NO ({i1},{i2},{i3})')")"
echo "Popular hidden?: $(grep -c 'Popular' home.html)"
echo "hero badge: $(grep -o 'PREMIUM STREAMING &amp; DIGITAL GOODS' home.html | head -1)"
echo "hero title: $(grep -o 'Cinema Experience' home.html | head -1)"
echo "gold CTA: $(grep -c 'bg-\[#f5c451\]' home.html)"
echo "hero slider images: $(grep -o 'photo-1440404653325\|photo-1489599849927' home.html | sort -u | wc -l)"
echo "category slider: $(grep -c 'snap-start' home.html)"

echo "== product page: slider + real best value =="
SLUG=$(curl -s -b /tmp/th.txt $BASE/api/admin/products | python -c "import sys,json; print(json.load(sys.stdin)[0]['slug'])")
curl -s "$BASE/products/$SLUG" -o prod.html
echo "slider imgs: $(grep -o 'photo-1522869635100\|photo-1593359677879\|photo-1574375927938' prod.html | sort -u | wc -l)"
echo "best value on 12M (0.11/day < 0.083/day? NO — 9000/365=24.7/day vs 1500/30=50/day): $(grep -c 'Best value' prod.html)"
echo "per-day shown: $(grep -oE '[0-9]+\.[0-9]{2} DZD/day' prod.html | head -2 | tr '\n' ' ')"
echo "== cleanup =="
PID2=$(curl -s -b /tmp/th.txt $BASE/api/admin/products | python -c "import sys,json; print(json.load(sys.stdin)[0]['id'])")
$J -X DELETE "$BASE/api/admin/products/$PID2" > /dev/null && echo "prod deleted"
$J -X DELETE "$BASE/api/admin/categories/$CATID" > /dev/null && echo "cat deleted"
$J -X PATCH -d '{"siteName":"DigitalStore","heroBadge":"Order directly via WhatsApp • Telegram • No account needed","heroTitle":"Premium |Digital Products| at the |Best Prices|","heroSubtitle":"Subscriptions, IPTV, software licenses, game cards and gift cards. Browse, choose your plan, and message us on your favorite app — we handle the rest personally.","heroCtaText":"Explore Products","heroImages":[],"sections":[{"key":"categories","title":"Browse Categories","visible":true,"sort":1},{"key":"featured","title":"Featured","visible":true,"sort":2},{"key":"popular","title":"Popular","visible":true,"sort":3},{"key":"newest","title":"New Arrivals","visible":true,"sort":4},{"key":"howitworks","title":"How it works","visible":true,"sort":5}]}' $BASE/api/admin/settings > /dev/null && echo "settings restored"
rm -f home.html prod.html
echo "THEME+SLIDER VERIFICATION DONE"
