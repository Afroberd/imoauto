# Domínio de produção e indexação — IMOAUTO

**Canónico:** `https://www.imoauto.cv` (decisão de projeto — o site está montado
assim desde o lançamento; o Vercel redireciona `imoauto.cv` → `www` com 308).
Não inverter sem motivo forte: mexeria em Vercel, sitemap, emails e sinais SEO
já acumulados, para ganho nulo.

## DNS (Namecheap → Advanced DNS de imoauto.cv)
- `A @` → `216.198.79.1` (Vercel)
- `CNAME www` → `eef5f4589a05aba0.vercel-dns-017.com`
- Registos de email (Resend): TXT `send` (SPF) · MX `send` (prio 10) ·
  TXT `_dmarc` · TXT `resend._domainkey` (DKIM)
- Validar: `nslookup www.imoauto.cv 8.8.8.8` (deve dar IPs do Vercel)
- ⚠️ Renovação: o domínio EXPIROU em jun/2026 (site caiu). Renovado até
  jun/2027. Confirmar auto-renew + cartão válido na Namecheap.

## Hosting (Vercel, projeto imoauto)
- Domains: `www.imoauto.cv` (primário) + `imoauto.cv` (redirect) + vercel.app
- HTTPS/SSL automático pelo Vercel ✅
- Env obrigatórias: NEXT_PUBLIC_SUPABASE_URL/ANON_KEY, RESEND_API_KEY,
  EMAIL_FROM, NOTIFICATION_WEBHOOK_SECRET, CRON_SECRET
  (opcional NEXT_PUBLIC_SITE_URL; default = https://www.imoauto.cv)

## Google Search Console (manual, por fazer)
1. Criar propriedade de domínio `imoauto.cv` (cobre www e apex)
2. Verificar por DNS: adicionar o TXT que a Google fornecer na Namecheap
   (usar o token real da Google — nunca comitar no repo)
3. Submeter sitemap: `https://www.imoauto.cv/sitemap.xml`
4. Inspecionar homepage + 1 anúncio de imóvel + 1 de carro
5. Monitorizar cobertura/canónicos duplicados

## Validação pós-deploy
```
curl -I https://imoauto.cv            # 308 → https://www.imoauto.cv/
curl -I https://www.imoauto.cv        # 200
curl https://www.imoauto.cv/robots.txt    # allow /, disallow privados, sitemap
curl https://www.imoauto.cv/sitemap.xml   # XML válido, só URLs www
curl https://www.imoauto.cv/api/health    # {"status":"ok","service":"imoauto-web"}
curl -s https://www.imoauto.cv | grep canonical   # rel=canonical www
```
Indexação: páginas públicas têm `link rel=canonical`; privadas
(admin/dashboard/login/registo/mensagens/perfil/favoritos/verificação/reset)
têm `noindex, nofollow`; anúncios inexistentes devolvem 404.
