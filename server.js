const express = require('express');
const session = require('express-session');
const app = express();

app.set('view engine', 'ejs');
app.use(express.json());
app.use(session({ secret: 'kb_clone_pro', resave: true, saveUninitialized: true }));

const ITEMS = [
    { id: 1, name: 'M9 Bayonet | Gamma Doppler', price: 95000, rarity: 'gold', chance: 0.5, img: 'https://community.cloudflare.steamstatic.com' },
    { id: 2, name: 'AK-47 | Inheritance', price: 12500, rarity: 'covert', chance: 2, img: 'https://community.cloudflare.steamstatic.com' },
    { id: 3, name: 'P250 | Sand Dune', price: 15, rarity: 'mil-spec', chance: 97.5, img: 'https://community.cloudflare.steamstatic.com' }
];

const CASES = {
    'gamma': { name: 'GAMMA', price: 89, img: 'https://case-battle.vip', items: ITEMS },
    '007': { name: '007', price: 349, img: 'https://case-battle.vip', items: ITEMS }
};

app.get('/', (req, res) => res.render('index', { user: req.session.user || null, cases: CASES, allItems: ITEMS }));

app.get('/auth/steam', (req, res) => {
    req.session.user = { name: 'ADMIN_TOXIC', balance: 5000, inventory: [], lvl: 1, xp: 0 };
    res.redirect('/');
});

app.post('/api/open/:id', (req, res) => {
    const c = CASES[req.params.id];
    const user = req.session.user;
    if (!user || user.balance < c.price) return res.json({ error: 'Баланс!' });
    let rand = Math.random() * 100, cum = 0, win = c.items[c.items.length-1];
    for (let i of c.items) { cum += i.chance; if (rand <= cum) { win = i; break; } }
    user.balance -= c.price;
    const drop = { ...win, iid: Date.now() };
    user.inventory.push(drop);
    res.json({ win: drop, balance: user.balance });
});

app.post('/api/sell', (req, res) => {
    const { iid } = req.body;
    const user = req.session.user;
    const idx = user.inventory.findIndex(i => i.iid == iid);
    if (idx > -1) {
        user.balance += Math.floor(user.inventory[idx].price * 0.8);
        user.inventory.splice(idx, 1);
        return res.json({ success: true, balance: user.balance });
    }
    res.json({ error: "Ошибка" });
});

app.listen(process.env.PORT || 3000);
