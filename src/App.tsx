import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck, BookOpen, Check, ChevronDown,
  CircleDollarSign, Clock3, Compass, Copy, ExternalLink, HeartHandshake, Leaf, Menu,
  Plus, Search, ShieldCheck, Sparkles, Target, Wallet, X, Zap,
} from 'lucide-react';
import { starterCampaigns, CAMPAIGNS_KEY, CONTRIBUTIONS_KEY } from './data';
import { connectWallet, contributeOnTestnet, refreshBalance, TESTNET_EXPLORER, TESTNET_FAUCET } from './lib/stellar';
import type { Campaign, CampaignCategory, WalletInfo } from './types';

type ModalState = { kind: 'create' } | { kind: 'contribute'; campaign: Campaign } | null;
type Contribution = { campaignId: string; amount: number; hash: string; at: number };

const money = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n);
const short = (s: string) => s ? `${s.slice(0, 6)}…${s.slice(-5)}` : '';
const readCampaigns = (): Campaign[] => {
  try {
    const saved = localStorage.getItem(CAMPAIGNS_KEY);
    return saved ? [...JSON.parse(saved) as Campaign[], ...starterCampaigns] : starterCampaigns;
  } catch { return starterCampaigns; }
};
const readContributions = (): Contribution[] => {
  try { return JSON.parse(localStorage.getItem(CONTRIBUTIONS_KEY) || '[]') as Contribution[]; }
  catch { return []; }
};

function App() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(readCampaigns);
  const [contributions, setContributions] = useState<Contribution[]>(readContributions);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All causes');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => { localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns.filter(c => !c.demo))); }, [campaigns]);
  useEffect(() => { localStorage.setItem(CONTRIBUTIONS_KEY, JSON.stringify(contributions)); }, [contributions]);

  const filtered = useMemo(() => campaigns.filter(c =>
    (category === 'All causes' || c.category === category) &&
    (c.title.toLowerCase().includes(query.toLowerCase()) || c.description.toLowerCase().includes(query.toLowerCase()))
  ), [campaigns, category, query]);

  const raisedTotal = campaigns.reduce((sum, c) => sum + c.raised, 0);
  const handleConnect = async () => {
    setConnecting(true); setError('');
    try {
      const result = await connectWallet();
      setWallet(result);
      setToast('Freighter connected to Stellar Testnet.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Wallet connection failed.'); }
    finally { setConnecting(false); }
  };

  const createCampaign = (data: Omit<Campaign, 'id' | 'raised' | 'createdAt'>) => {
    if (!wallet) { setError('Connect your Freighter testnet wallet before creating a campaign.'); return; }
    const campaign: Campaign = { ...data, id: crypto.randomUUID(), raised: 0, createdAt: Date.now() };
    setCampaigns(prev => [campaign, ...prev]);
    setModal(null);
    setToast('Campaign created in this browser. Share the project and receiving address with supporters.');
  };

  const contribute = async (campaign: Campaign, amount: number) => {
    if (!wallet) { setError('Connect your Freighter wallet first.'); return; }
    if (campaign.demo) { setError('This is a sample campaign. Create a real campaign with a testnet receiving wallet to accept contributions.'); return; }
    setBusy(true); setError('');
    try {
      const hash = await contributeOnTestnet(wallet.address, campaign.creator, amount, campaign.id);
      setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, raised: c.raised + amount } : c));
      setContributions(prev => [{ campaignId: campaign.id, amount, hash, at: Date.now() }, ...prev]);
      try { setWallet({ ...wallet, balance: await refreshBalance(wallet.address) }); } catch { /* payment is already confirmed */ }
      setModal(null);
      setToast(`Contribution of ${money(amount)} XLM submitted to Stellar Testnet.`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Transaction failed.'); }
    finally { setBusy(false); }
  };

  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); setToast('Copied to clipboard.'); }
    catch { setError('Clipboard access is unavailable in this browser.'); }
  };

  return <div className="app">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <a className="brand" href="#home"><span className="brand-icon"><Sparkles size={19}/></span><span>orbit<span>fund</span><small>COMMUNITY POWERED</small></span></a>
      <div className="side-label">DISCOVER</div>
      <a className="side-link active" href="#campaigns" onClick={() => setMobileNav(false)}><Compass size={18}/> Explore campaigns</a>
      <a className="side-link" href="#how" onClick={() => setMobileNav(false)}><HeartHandshake size={18}/> How it works</a>
      <a className="side-link" href="#activity" onClick={() => setMobileNav(false)}><Clock3 size={18}/> My activity</a>
      <div className="side-bottom">
        <div className="network-box"><div><i/> LIVE TESTNET</div><p>Powered by Stellar. Every approved contribution is a real testnet transaction.</p><a href="https://stellar.expert/explorer/testnet" target="_blank" rel="noreferrer">Testnet explorer <ExternalLink size={12}/></a></div>
        <div className="side-profile"><div className="profile-avatar">OF</div><div><b>{wallet ? short(wallet.address) : 'Guest supporter'}</b><small>{wallet ? 'Wallet connected' : 'Connect to participate'}</small></div></div>
      </div>
    </aside>
    {mobileNav && <button className="scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation"/>}
    <main className="main" id="home">
      <header className="topbar">
        <button className="mobile-toggle" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle menu"><Menu/></button>
        <div className="crumb">Orbit Fund <span>/</span> <b>Discover</b></div>
        <div className="top-right"><span className="testnet-pill"><i/> Stellar Testnet</span><button className="connect-btn" onClick={handleConnect} disabled={connecting}><Wallet size={16}/>{connecting ? 'Connecting…' : wallet ? short(wallet.address) : 'Connect wallet'}</button></div>
      </header>

      {error && <div className="alert error"><span>{error}</span><button onClick={() => setError('')}><X size={15}/></button></div>}
      {toast && <div className="alert success"><Check size={16}/><span>{toast}</span><button onClick={() => setToast('')}><X size={15}/></button></div>}

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span/> FUND WHAT MOVES YOU</div>
          <h1>Small acts.<br/><em>Big impact.</em></h1>
          <p>Back bold ideas, support your community, and help good things happen — one contribution at a time on Stellar.</p>
          <div className="hero-actions"><a className="primary-btn" href="#campaigns">Explore campaigns <ArrowRight size={16}/></a><button className="secondary-btn" onClick={() => setModal({kind:'create'})}><Plus size={16}/> Start a campaign</button></div>
          <div className="hero-note"><ShieldCheck size={15}/> Testnet-powered · You approve every transaction</div>
        </div>
        <div className="hero-art">
          <div className="orb orb-one"/><div className="orb orb-two"/>
          <div className="hero-card card-back"><div className="mini-label">COMMUNITY FUND</div><div className="mini-stars">✳ ✳ ✳</div></div>
          <div className="hero-card card-front"><div className="card-top"><span>✳ orbitfund</span><span className="live-dot">● LIVE</span></div><div className="card-number">$<b>1</b> idea can start it all.</div><div className="card-bottom"><span>POWERED BY STELLAR</span><Zap size={21}/></div></div>
          <div className="floating-chip"><HeartHandshake size={17}/> People-powered change</div>
        </div>
      </section>

      <section className="stats">
        <div><span className="stat-icon"><CircleDollarSign size={18}/></span><div><small>Raised across listed campaigns</small><b>{money(raisedTotal)} <i>XLM</i></b></div></div>
        <div><span className="stat-icon"><Target size={18}/></span><div><small>Campaigns</small><b>{campaigns.filter(c => !c.demo).length} <i>community-created</i></b></div></div>
        <div><span className="stat-icon"><HeartHandshake size={18}/></span><div><small>Your contributions</small><b>{contributions.length} <i>transactions</i></b></div></div>
      </section>

      <section className="campaign-section" id="campaigns">
        <div className="section-head"><div><div className="eyebrow">GOOD IDEAS LIVE HERE</div><h2>Find your <em>cause.</em></h2><p>Discover projects making a difference.</p></div><button className="create-link" onClick={() => setModal({kind:'create'})}><Plus size={16}/> Create campaign</button></div>
        <div className="toolbar"><label className="search"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search campaigns…"/></label><label className="category"><span>Cause</span><select value={category} onChange={e => setCategory(e.target.value)}><option>All causes</option><option>Community</option><option>Technology</option><option>Education</option><option>Environment</option><option>Creative</option></select><ChevronDown size={14}/></label><span className="found">{filtered.length} campaigns</span></div>
        {filtered.length ? <div className="campaign-grid">{filtered.map(c => <CampaignCard key={c.id} campaign={c} onContribute={() => { setError(''); setModal({kind:'contribute', campaign:c}); }}/>)}</div> : <div className="empty"><Sparkles size={24}/><h3>No campaigns found</h3><p>Try another search or create a new campaign.</p><button onClick={() => setModal({kind:'create'})}>Start a campaign <ArrowRight size={15}/></button></div>}
        <p className="demo-note">Sample campaigns are illustrative previews. Only campaigns created with a connected wallet can receive testnet contributions.</p>
      </section>

      <section className="how-section" id="how"><div className="eyebrow">SIMPLE BY DESIGN</div><h2>Good things happen <em>together.</em></h2><div className="steps">
        <article><span>01</span><BookOpen size={21}/><h3>Discover a cause</h3><p>Explore community projects and choose an idea you believe in.</p></article>
        <article><span>02</span><Wallet size={21}/><h3>Connect your wallet</h3><p>Connect Freighter on Stellar Testnet. Keep control of your keys.</p></article>
        <article><span>03</span><HeartHandshake size={21}/><h3>Make an impact</h3><p>Approve an XLM payment in Freighter and verify it on the testnet explorer.</p></article>
      </div></section>

      <section className="activity-section" id="activity"><div className="section-head"><div><div className="eyebrow">YOUR FOOTPRINT</div><h2>Recent <em>activity.</em></h2></div>{wallet && <span className="address-chip">{short(wallet.address)}</span>}</div>
        {contributions.length ? <div className="activity-list">{contributions.slice(0,5).map(item => <div className="activity-row" key={item.hash}><span className="activity-check"><Check size={15}/></span><div><b>{campaigns.find(c => c.id === item.campaignId)?.title || 'Campaign contribution'}</b><small>{new Date(item.at).toLocaleString()}</small></div><strong>{money(item.amount)} XLM</strong><a href={`${TESTNET_EXPLORER}/tx/${item.hash}`} target="_blank" rel="noreferrer"><ExternalLink size={15}/></a></div>)}</div> : <div className="activity-empty"><Clock3 size={18}/> Your confirmed testnet contributions will appear here.</div>}
      </section>

      <footer><a className="footer-brand" href="#home">✳ orbitfund</a><span>Community-powered crowdfunding on Stellar Testnet.</span><a href={TESTNET_FAUCET} target="_blank" rel="noreferrer">Get test XLM <ExternalLink size={13}/></a></footer>
    </main>
    {modal?.kind === 'create' && <CreateModal wallet={wallet} onClose={() => setModal(null)} onCreate={createCampaign} onConnect={handleConnect}/>}
    {modal?.kind === 'contribute' && <ContributeModal campaign={modal.campaign} wallet={wallet} busy={busy} onClose={() => !busy && setModal(null)} onContribute={contribute} onConnect={handleConnect}/>}
  </div>;
}

function CampaignCard({campaign:c,onContribute}:{campaign:Campaign;onContribute:()=>void}) {
  const progress = Math.min(100, Math.round(c.raised / c.goal * 100));
  const days = Math.max(0, Math.ceil((new Date(c.deadline).getTime() - Date.now()) / 86400000));
  return <article className="campaign-card">
    <div className="campaign-image"><img src={c.image} alt="" loading="lazy"/><span className="category-tag">{c.category}</span>{c.demo && <span className="sample-tag">SAMPLE</span>}</div>
    <div className="campaign-body"><div className="campaign-meta"><span><i/> {c.demo ? 'Example project' : 'Community campaign'}</span><span><Clock3 size={13}/> {days} days left</span></div><h3>{c.title}</h3><p>{c.description}</p>
      <div className="raised-line"><span>Raised <b>{money(c.raised)} XLM</b></span><strong>{progress}%</strong></div><div className="progress"><i style={{width:`${progress}%`}}/></div>
      <div className="goal-line"><span>Goal: {money(c.goal)} XLM</span><span>{money(Math.max(0,c.goal-c.raised))} to go</span></div>
      <button className="support-btn" onClick={onContribute} disabled={c.demo || c.raised >= c.goal}>{c.demo ? 'Sample campaign' : c.raised >= c.goal ? 'Goal reached' : 'Support this project'} <ArrowUpRight size={15}/></button>
    </div>
  </article>;
}

function CreateModal({wallet,onClose,onCreate,onConnect}:{wallet:WalletInfo|null;onClose:()=>void;onCreate:(d:Omit<Campaign,'id'|'raised'|'createdAt'>)=>void;onConnect:()=>void}) {
  const [title,setTitle] = useState(''); const [description,setDescription] = useState('');
  const [goal,setGoal] = useState('100'); const [category,setCategory] = useState<CampaignCategory>('Community');
  const [deadline,setDeadline] = useState('2027-01-31'); const [image,setImage] = useState('');
  const [receiver,setReceiver] = useState(wallet?.address || '');
  const [localError,setLocalError] = useState('');
  useEffect(() => { if(wallet) setReceiver(wallet.address); },[wallet]);
  const submit = (e:FormEvent) => {
    e.preventDefault(); const value = Number(goal);
    if(title.trim().length < 5 || description.trim().length < 20) { setLocalError('Add a title (5+ characters) and a description (20+ characters).'); return; }
    if(!Number.isFinite(value) || value <= 0) { setLocalError('Enter a valid funding goal.'); return; }
    if(!/^G[A-Z2-7]{55}$/.test(receiver.trim())) { setLocalError('Enter a valid Stellar public receiving address.'); return; }
    if(new Date(deadline).getTime() <= Date.now()) { setLocalError('Choose a future deadline.'); return; }
    onCreate({title:title.trim(),description:description.trim(),category,goal:value,creator:receiver.trim(),deadline,image:image.trim() || 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=1200&q=85'});
  };
  return <div className="modal-layer" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><div className="modal-box"><button className="close" onClick={onClose}><X/></button><div className="eyebrow">START SOMETHING GOOD</div><h2>Create a campaign</h2><p className="modal-intro">Set a goal and publish a campaign in this browser. Your connected wallet receives contributions directly.</p>
    {!wallet && <div className="inline-warning">Connect Freighter on Testnet to create a campaign. <button onClick={onConnect}>Connect wallet</button></div>}
    <form onSubmit={submit}><label>Campaign title<input required minLength={5} value={title} onChange={e=>setTitle(e.target.value)} placeholder="What are you raising funds for?"/></label><label>Describe your idea<textarea required minLength={20} rows={3} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Tell supporters why this matters…"/></label><div className="form-row"><label>Category<select value={category} onChange={e=>setCategory(e.target.value as CampaignCategory)}><option>Community</option><option>Technology</option><option>Education</option><option>Environment</option><option>Creative</option></select></label><label>Goal (XLM)<input required type="number" min="1" step="0.1" value={goal} onChange={e=>setGoal(e.target.value)}/></label></div><div className="form-row"><label>Deadline<input required type="date" value={deadline} min={new Date(Date.now()+86400000).toISOString().slice(0,10)} onChange={e=>setDeadline(e.target.value)}/></label><label>Cover image URL <input value={image} onChange={e=>setImage(e.target.value)} placeholder="Optional https://…"/></label></div><label>Receiving wallet (G… address)<input required value={receiver} onChange={e=>setReceiver(e.target.value)} placeholder="Stellar public address"/></label>{localError && <p className="form-error">{localError}</p>}<div className="form-warning"><ShieldCheck size={16}/> Contributions are direct XLM payments to this wallet — no escrow or automatic refunds.</div><button className="primary-btn wide" disabled={!wallet}>Publish campaign <ArrowRight size={16}/></button></form>
  </div></div>;
}

function ContributeModal({campaign,wallet,busy,onClose,onContribute,onConnect}:{campaign:Campaign;wallet:WalletInfo|null;busy:boolean;onClose:()=>void;onContribute:(c:Campaign,n:number)=>void;onConnect:()=>void}) {
  const [amount,setAmount] = useState('5');
  const [ack,setAck] = useState(false);
  const value = Number(amount);
  return <div className="modal-layer" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)onClose();}}><div className="modal-box contribute-box"><button className="close" onClick={onClose} disabled={busy}><X/></button><div className="eyebrow">BACK THIS IDEA</div><h2>{campaign.title}</h2><p className="modal-intro">Your contribution is sent as a native XLM payment on Stellar Testnet.</p><div className="receiver"><small>Receiving wallet</small><b>{short(campaign.creator)}</b><button onClick={()=>navigator.clipboard.writeText(campaign.creator)}><Copy size={14}/> Copy</button></div><label>Contribution amount (XLM)<input type="number" min="0.0000001" max="1000000" step="0.1" value={amount} onChange={e=>setAmount(e.target.value)}/></label><div className="amount-options">{['1','5','10','25'].map(n=><button className={amount===n?'chosen':''} key={n} onClick={()=>setAmount(n)}>{n} XLM</button>)}</div><label className="ack"><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)}/> I understand this is a testnet payment sent directly to the campaign creator, not an escrow account.</label>{!wallet && <div className="inline-warning">Connect your Freighter wallet to continue. <button onClick={onConnect}>Connect wallet</button></div>}<button className="primary-btn wide" disabled={!wallet||!ack||!Number.isFinite(value)||value<=0||busy} onClick={()=>onContribute(campaign,value)}>{busy?'Waiting for network…':`Contribute ${money(value)} XLM`} <ArrowRight size={16}/></button><p className="tiny-note">You will review and approve the transaction in Freighter. Never share your secret key.</p></div></div>;
}

export default App;
