import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Accueil.css";

// Import statique depuis src/assets/
import img1920 from "../../assets/AP7.jpeg";
import img1921 from "../../assets/AP2.jpeg";
import img1965 from "../../assets/AP3.jpeg";
import img1975 from "../../assets/AP5.jpeg";
import img2008 from "../../assets/AP4.jpeg";
import img2024 from "../../assets/AP7.jpeg";

const timelineData = [
    {
        year: "1920",
        title: "Fondation de l'OCP",
        description: "Création de l'Office Chérifien des Phosphates sous le protectorat français, marquant le début de l'exploitation des gisements de phosphate au Maroc.",
        image: img1920,
        side: "left",
    },
    {
        year: "1921",
        title: "Première Production à Khouribga",
        description: "Lancement des premières extractions de phosphate à Khouribga, posant les fondations d'une industrie minière d'envergure mondiale.",
        image: img1921,
        side: "right",
    },
    {
        year: "1965",
        title: "Expansion et Modernisation",
        description: "Après l'indépendance du Maroc, l'OCP modernise ses équipements et ses procédés d'extraction, augmentant significativement sa capacité de production.",
        image: img1965,
        side: "left",
    },
    {
        year: "1975",
        title: "Société Anonyme",
        description: "Transformation en société anonyme, renforçant la gouvernance et la capacité d'investissement à l'international.",
        image: img1975,
        side: "right",
    },
    {
        year: "2008",
        title: "OCP Group",
        description: "Adoption de la dénomination OCP SA, marquant la naissance d'un groupe industriel intégré, leader mondial dans la valorisation du phosphate.",
        image: img2008,
        side: "left",
    },
    {
        year: "2024",
        title: "Leader Mondial",
        description: "Premier exportateur mondial de phosphate, avec une capacité de production dépassant 38 millions de tonnes par an.",
        image: img2024,
        side: "right",
    },
];
const navLinks = ["Accueil", "Statistiques", "Histoire", "Service"];

export default function Accueil() {
    const [scrollY, setScrollY] = useState(0);
    const [visibleItems, setVisibleItems] = useState(new Set());
    const itemRefs = useRef([]);

    const heroRef = useRef(null);
    const statsRef = useRef(null);
    const histoireRef = useRef(null);
    const serviceRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setVisibleItems((prev) => new Set([...prev, entry.target.dataset.index]));
                    }
                });
            },
            { threshold: 0.15 }
        );
        itemRefs.current.forEach((ref) => ref && observer.observe(ref));
        return () => observer.disconnect();
    }, []);

    const scrollToSection = (sectionRef) => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const handleNavClick = (link) => {
        switch (link) {
            case "Accueil": scrollToSection(heroRef); break;
            case "Statistiques": scrollToSection(statsRef); break;
            case "Histoire": scrollToSection(histoireRef); break;
            case "Service": scrollToSection(serviceRef); break;
            default: break;
        }
    };

    const navigate = useNavigate();
    const handleConnect = () => navigate('/login');
    const handleChat = () => alert("💬 Assistance OCP : Un conseiller vous répondra sous 2 minutes.");
    const handleLogoClick = () => window.scrollTo({ top: 0, behavior: "smooth" });

    return (
        <div className="page">
            {/* NAVIGATION */}
            <nav className={`nav ${scrollY > 40 ? "scrolled" : ""}`}>
                <div className="nav-inner">
                    <div className="logo" onClick={handleLogoClick}>
                        <div className="logo-icon">
                            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                                <circle cx="11" cy="11" r="10" stroke="#00a651" strokeWidth="2" />
                                <path d="M6 11h10M11 6v10" stroke="#00a651" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <div>
                            <div className="logo-name">OCP Khouribga</div>
                            <div className="logo-sub">Gestion des interventions</div>
                        </div>
                    </div>
                    <div className="nav-links">
                        {navLinks.map((l) => (
                            <button key={l} onClick={() => handleNavClick(l)} className="nav-link">
                                {l}
                            </button>
                        ))}
                    </div>
                    <button className="connect-btn" onClick={handleConnect}>Se Connecter</button>
                </div>
            </nav>

            {/* HERO (sans les boutons) */}
            <section ref={heroRef} className="hero">
                <div className="hero-bg" />
                <div className="hero-diamond" />
                <div className="hero-content">
                    <h1 className="hero-title">Plus d'un <span className="hero-green">Siècle d'Histoire</span></h1>
                    <p className="hero-sub">
                        Découvrez l'évolution remarquable de l'OCP Khouribga, de ses débuts modestes
                        <br />en 1920 à son statut actuel de leader mondial.
                    </p>
                </div>
            </section>

            {/* STATISTIQUES */}
            <section ref={statsRef} className="stats-section">
                <h2 className="section-title">Chiffres Clés</h2>
                <div className="stats-grid">
                    <div className="stat-card"><div className="stat-number">38M+</div><div className="stat-label">Tonnes / an</div><div className="stat-desc">Capacité de production</div></div>
                    <div className="stat-card"><div className="stat-number">1er</div><div className="stat-label">Exportateur mondial</div><div className="stat-desc">Phosphate & dérivés</div></div>
                    <div className="stat-card"><div className="stat-number">100+</div><div className="stat-label">Pays clients</div><div className="stat-desc">Monde entier</div></div>
                    <div className="stat-card"><div className="stat-number">7 000+</div><div className="stat-label">Employés</div><div className="stat-desc">dans la région</div></div>
                </div>
            </section>

            {/* HISTOIRE - TIMELINE */}
            <section ref={histoireRef} className="timeline-section">
                <h2 className="section-title">Notre Histoire</h2>
                <div className="timeline-line" />
                {timelineData.map((item, i) => {
                    const visible = visibleItems.has(String(i));
                    const isLeft = item.side === "left";
                    return (
                        <div
                            key={i}
                            ref={(el) => (itemRefs.current[i] = el)}
                            data-index={i}
                            className={`timeline-row ${visible ? "visible" : ""}`}
                            style={{ transitionDelay: `${i * 0.08}s` }}
                        >
                            <div className="timeline-half" style={{ alignItems: isLeft ? "flex-end" : "flex-start" }}>
                                <div className="card">
                                    <span className="year-badge">{item.year}</span>
                                    <h3 className="card-title">{item.title}</h3>
                                    <p className="card-desc">{item.description}</p>
                                </div>
                            </div>
                            <div className="dot-wrap"><div className="dot" /></div>
                            <div className="timeline-half" style={{ alignItems: isLeft ? "flex-start" : "flex-end" }}>
                                <div className="img-wrap">
                                    <img src={item.image} alt={item.title} className="img" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </section>

            {/* SERVICES */}
            <section ref={serviceRef} className="services-section">
                <h2 className="section-title">Nos Services d'Intervention</h2>
                <div className="services-grid">
                    <div className="service-card"><div className="service-icon">💻</div><h3 className="service-title">N1 – Intervention à distance</h3><p className="service-desc">Diagnostic et résolution à distance par notre technicien N1.</p></div>
                    <div className="service-card"><div className="service-icon">🔧</div><h3 className="service-title">N2 – Déplacement sur site</h3><p className="service-desc">Si le problème persiste, le technicien N2 se déplace.</p></div>
                    <div className="service-card"><div className="service-icon">⚠️</div><h3 className="service-title">N3 – Équipement hors service</h3><p className="service-desc">Panne majeure ou équipement HS, intervention lourde.</p></div>
                    <div className="service-card"><div className="service-icon">📊</div><h3 className="service-title">Suivi & escalade</h3><p className="service-desc">Escalade automatique N1→N2→N3, notifications temps réel.</p></div>
                </div>
            </section>

            {/* FOOTER AJOUTÉ */}
            <footer className="footer">
                <div className="footer-container">
                    <div className="footer-col">
                        <div className="footer-logo">
                            <div className="footer-logo-icon">💻</div>
                            <span>OCP Khouribga</span>
                        </div>
                        <p>Application de gestion des interventions informatiques – Service Informatique OCP.</p>
                    </div>
                    <div className="footer-col">
                        <h4>Navigation</h4>
                        <ul>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); scrollToSection(heroRef); }}>Accueil</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); scrollToSection(statsRef); }}>Statistiques</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); scrollToSection(histoireRef); }}>Histoire</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); scrollToSection(serviceRef); }}>Service</a></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h4>Support</h4>
                        <ul>
                            <li><a href="#">FAQ</a></li>
                            <li><a href="#">Assistance technique</a></li>
                            <li><a href="#">Documentation</a></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h4>Coordonnées</h4>
                        <p>OCP Khouribga – Site industriel</p>
                        <p>📞 +212 523 48 21 00</p>
                        <p>✉️ support.it@ocp.ma</p>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2026 OCP Khouribga – Service Informatique. Application de Gestion des Interventions – Digitalisation du support.</p>
                </div>
            </footer>

            {/* BOUTON CHAT */}
            <button className="chat-btn" onClick={handleChat} title="Aide">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M20 2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14l4 4V4a2 2 0 0 0-2-2z" fill="white" />
                    <circle cx="8" cy="10" r="1.2" fill="#7c5cbf" />
                    <circle cx="12" cy="10" r="1.2" fill="#7c5cbf" />
                    <circle cx="16" cy="10" r="1.2" fill="#7c5cbf" />
                </svg>
            </button>
        </div>
    );
}