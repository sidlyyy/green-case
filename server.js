const express = require('express');
const session = require('express-session');
const app = express();

app.set('view engine', 'ejs');
app.use(express.json());
app.use(session({ secret: 'kb_toxic_pro', resave: true, saveUninitialized: true }));

// БАЗА ВСЕХ ПРЕДМЕТОВ (Общая для всех модулей)
const ITEMS = [
    { id: 1, name: 'M9 Bayonet | Gamma Doppler', price: 95000, rarity: 'gold', img: 'https://community.cloudflare.steamstatic.com' },
    { id: 2, name: 'AK-47 | Inheritance', price: 12500, rarity: 'covert', img: 'https://community.cloudflare.steamstatic.com' },
    { id: 3, name: 'USP-S | Kill Confirmed', price: 4500, rarity: 'classified', img: 'https://community.cloudflare.steamstatic.com' },
    { id: 4, name: 'P250 | Sand Dune', price: 15, rarity: 'mil-spec', img: 'https://community.cloudflare.steamstatic.com' }
];

const CASES = {
    'gamma': { name: 'GAMMA', price: 89, img: 'https://case-battle.vip', items: ITEMS },
    '007': { name: '007', price: 349, img: 'https://case-battle.vip', items: ITEMS },
    'silver': { name: 'SILVER', price: 49, img: 'https://case-battle.vip', items: [ITEMS[3], ITEMS[3], ITEMS[2]] }
};

let drops = [];

app.get('/', (req, res) => res.render('index', { user: req.session.user || null, cases: CASES, shop: ITEMS, drops }));

app.get('/auth/steam', (req, res) => {
    req.session.user = { name: 'ADMIN_TOXIC', balance: 10000, inventory: [] };
    res.redirect('/');
});

app.post('/api/open/:id', (req, res) => {
    const c = CASES[req.params.id];
    const user = req.session.user;
    if (!user || user.balance < c.price) return res.json({ error: 'Баланс!' });
    user.balance -= c.price;
    const win = c.items[Math.floor(Math.random() * c.items.length)];
    const drop = { ...win, iid: Date.now() };
    user.inventory.push(drop);
    drops.unshift(drop);
    res.json({ win: drop, balance: user.balance });
});

app.post('/api/sell', (req, res) => {
    const { iid } = req.body;
    const user = req.session.user;
    const idx = user.inventory.findIndex(i => i.iid == iid);
    if (idx > -1) {
        user.balance += Math.floor(user.inventory[idx].price * 0.8);
        user.inventory.splice(idx, 1);
        res.json({ success: true, balance: user.balance });
    }
});

app.post('/api/upgrade', (req, res) => {
    const { myIid, targetId } = req.body;
    const user = req.session.user;
    const myItem = user.inventory.find(i => i.iid == myIid);
    const targetItem = ITEMS.find(i => i.id == targetId);
    if (!myItem || !targetItem) return res.json({ error: 'Ошибка' });
    const chance = Math.min((myItem.price / targetItem.price) * 100, 95);
    user.inventory = user.inventory.filter(i => i.iid != myIid);
    const win = Math.random() * 100 <= chance;
    if (win) user.inventory.push({ ...targetItem, iid: Date.now() });
    res.json({ success: win, chance });
});

app.listen(process.env.PORT || 3000);
