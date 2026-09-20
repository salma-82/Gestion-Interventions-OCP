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
import logoOcp from "../../assets/logo-ocp.png"; // ✅ Logo OCP

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

const navLinks = ["Accueil", "Histoire", "Statistiques", "Service"];

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
            case "Histoire": scrollToSection(histoireRef); break;
            case "Statistiques": scrollToSection(statsRef); break;
            case "Service": scrollToSection(serviceRef); break;
            default: break;
        }
    };

    const navigate = useNavigate();
    const handleConnect = () => navigate('/login');
    const handleLogoClick = () => window.scrollTo({ top: 0, behavior: "smooth" });

    return (
        <div className="page">
            {/* NAVIGATION AVEC LOGO OCP */}
            <nav className={`nav ${scrollY > 40 ? "scrolled" : ""}`}>
                <div className="nav-inner">
                    <div className="logo" onClick={handleLogoClick}>
                        <img src={logoOcp} alt="Logo OCP" className="navbar-logo-img" />
                        <div>
                            <div className="logo-name">OCP Khouribga</div>

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

            {/* 1. HERO */}
            <section ref={heroRef} className="hero">
                <div className="hero-bg" />
                <div className="hero-diamond" />
                <div className="hero-content">
                    <h1 className="hero-title">Une Nouvelle Ère de<span className="hero-green"> Maintenance</span></h1>
                    <p className="hero-sub">
                        Découvrez la transformation digitale de notre gestion des interventions : passez des processus manuels traditionnels à un suivi intelligent, connecté et automatisé en temps réel.
                    </p>
                </div>
            </section>

            {/* 2. HISTOIRE - TIMELINE (Placé en premier) */}
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

            {/* 3. STATISTIQUES (Placé juste après l'histoire) */}
            <section ref={statsRef} className="stats-section">
                <h2 className="section-title">Chiffres Clés</h2>
                <div className="stats-grid">
                    <div className="stat-card">

                        <div className="stat-label">NIVEAUX DE SUPPORT</div>
                        <div className="stat-desc"> Terrain & Experts</div>
                    </div>
                    <div className="stat-card">

                        <div className="stat-label">TAUX DE RÉSOLUTION</div>
                        <div className="stat-desc">Des incidents clôturés</div>
                    </div>
                    <div className="stat-card">

                        <div className="stat-label">TICKETS / MOIS</div>
                        <div className="stat-desc">Traités avec succès</div>
                    </div>
                </div>
            </section>

            {/* 4. SERVICES */}
            <section ref={serviceRef} className="services-section">
                <h2 className="section-title">Nos Services d'Intervention</h2>
                <div className="services-grid">
                    <div className="service-card">

                        <h3 className="service-title">N1 – Intervention à distance</h3>
                        <p className="service-desc">
                            Diagnostic et résolution des pannes logicielles, problèmes d’accès, et incidents simples directement à distance.
                        </p>
                    </div>
                    <div className="service-card">

                        <h3 className="service-title">N2 – Déplacement sur site</h3>
                        <p className="service-desc">
                            Pour les problèmes complexes non résolubles à distance. Le technicien se déplace et tente une réparation sur place.
                        </p>
                    </div>
                    <div className="service-card">

                        <h3 className="service-title">N3 – Intervention lourde</h3>
                        <p className="service-desc">
                            Cas critiques : remplacement d’équipement, réparation physique, changement de pièces. Intervention sur site.
                        </p>
                    </div>
                    <div className="service-card">

                        <h3 className="service-title">Suivi & Escalade</h3>
                        <p className="service-desc">
                            Escalade automatique N1 → N2 → N3 si le problème persiste, avec notifications en temps réel.
                        </p>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="footer">
                <div className="footer-wave"></div>
                <div className="footer-container">
                    <div className="footer-col">
                        <div className="footer-logo">
                            <span>OCP Khouribga</span>
                        </div>
                        <p className="footer-description">
                            Application de gestion des interventions informatiques.<br />
                            Service Informatique OCP – Digitalisation du support.
                        </p>
                    </div>

                    <div className="footer-col">
                        <h4>Navigation</h4>
                        <ul>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); scrollToSection(heroRef); }}>Accueil</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); scrollToSection(histoireRef); }}>Histoire</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); scrollToSection(statsRef); }}>Statistiques</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); scrollToSection(serviceRef); }}>Service</a></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h4>Coordonnées</h4>
                        <ul className="footer-contact-list">
                            <li>📍 OCP Khouribga – Site industriel</li>
                            <li>📞 <a href="tel:+212523482100">+212 523 48 21 00</a></li>
                            <li>✉️ <a href="mailto:support.it@ocp.ma">support.it@ocp.ma</a></li>
                            <li>🕒 Lun – Jeu : 8h30 – 17h30</li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <div className="footer-bottom-inner">
                        <p>© 2026 OCP Khouribga – Service Informatique. Tous droits réservés.</p>
                        <div className="footer-legal">
                            <a href="#">Mentions légales</a>
                            <span className="separator">|</span>
                            <a href="#">Politique de confidentialité</a>
                            <span className="separator">|</span>
                            <a href="#">Cookies</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}