const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.set('view engine', 'ejs');
app.use(express.json());
app.use(session({ secret: 'toxic_pro_secret', resave: true, saveUninitialized: true }));

// БАЗА ПРЕДМЕТОВ
const ITEMS = [
    { id: 1, name: 'M9 Bayonet | Gamma', price: 95000, rarity: 'gold', chance: 0.5, img: 'https://community.cloudflare.steamstatic.com' },
    { id: 2, name: 'AK-47 | Inheritance', price: 12000, rarity: 'covert', chance: 2, img: 'https://community.cloudflare.steamstatic.com' },
    { id: 3, name: 'USP-S | Kill Confirmed', price: 5000, rarity: 'classified', chance: 8, img: 'https://community.cloudflare.steamstatic.com' },
    { id: 4, name: 'P250 | Sand Dune', price: 10, rarity: 'mil-spec', chance: 89.5, img: 'https://community.cloudflare.steamstatic.com' }
];

const CASES = {
    'gamma': { name: 'GAMMA', price: 89, img: 'https://case-battle.vip', items: ITEMS },
    '007': { name: '007', price: 349, img: 'https://case-battle.vip', items: ITEMS },
    'silver': { name: 'SILVER', price: 49, img: 'https://case-battle.vip', items: ITEMS }
};

let liveDrops = [];

app.get('/', (req, res) => res.render('index', { user: req.session.user || null, cases: CASES, items: ITEMS, drops: liveDrops }));

app.get('/auth/steam', (req, res) => {
    req.session.user = { name: 'ADMIN_TOXIC', balance: 5000, inventory: [], xp: 0, lvl: 1 };
    res.redirect('/');
});

app.post('/open/:id', (req, res) => {
    const c = CASES[req.params.id];
    const user = req.session.user;
    if (!user || user.balance < c.price) return res.json({ error: 'Баланс!' });

    let rand = Math.random() * 100, cum = 0, win = c.items[c.items.length-1];
    for (let i of c.items) { cum += i.chance; if (rand <= cum) { win = i; break; } }

    user.balance -= c.price;
    user.xp += Math.floor(c.price / 10);
    if(user.xp >= 1000) { user.lvl++; user.xp = 0; }
    
    const drop = { ...win, iid: Date.now(), uName: user.name };
    user.inventory.push(drop);
    liveDrops.unshift(drop);
    if(liveDrops.length > 15) liveDrops.pop();
    io.emit('newDrop', drop);
    res.json({ win: drop, balance: user.balance, xp: user.xp, lvl: user.lvl });
});

http.listen(process.env.PORT || 3000);
