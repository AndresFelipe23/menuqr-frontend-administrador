import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  structuredData?: object | null;
  noindex?: boolean;
  canonical?: string;
}

export default function SEO({
  title = 'MenuQR - Menús Digitales con Códigos QR',
  description = 'Moderniza tu restaurante con menús digitales interactivos. Tus clientes escanean, ordenan y disfrutan. Simple, rápido y eficiente.',
  keywords = 'menú digital, código QR, restaurante, pedidos online, menú QR, digitalización restaurantes',
  image = '/logo.svg',
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  siteName = 'MenuQR',
  structuredData,
  noindex = false,
  canonical,
}: SEOProps) {
  useEffect(() => {
    // Actualizar title
    document.title = title;

    // Función helper para actualizar o crear meta tags
    const setMetaTag = (name: string, content: string, attribute: string = 'name') => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Meta tags básicos
    setMetaTag('description', description);
    setMetaTag('keywords', keywords);
    setMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes');
    setMetaTag('theme-color', '#6366F1');

    // Robots
    if (noindex) {
      setMetaTag('robots', 'noindex, nofollow');
    } else {
      setMetaTag('robots', 'index, follow');
    }

    // Open Graph
    setMetaTag('og:title', title, 'property');
    setMetaTag('og:description', description, 'property');
    setMetaTag('og:image', image, 'property');
    setMetaTag('og:url', url, 'property');
    setMetaTag('og:type', type, 'property');
    setMetaTag('og:site_name', siteName, 'property');
    setMetaTag('og:locale', 'es_CO', 'property');

    // Twitter Card
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', image);

    // Canonical URL
    if (canonical || url) {
      let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', canonical || url);
    }

    // Structured Data (JSON-LD)
    if (structuredData) {
      // Eliminar structured data anterior si existe
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }
  }, [title, description, keywords, image, url, type, siteName, structuredData, noindex, canonical]);

  return null;
}
