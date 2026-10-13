# Architecture Decision Records — alejosarmiento.com

Una decisión que no está aquí es una decisión que nadie puede cuestionar con conocimiento de causa.
Cuando algo no esté cubierto por `CLAUDE.md` ni por [`../plan.md`](../plan.md), se propone un ADR en
vez de decidirlo en silencio.

Formato: Contexto, Decisión, Consecuencias, Alternativas consideradas
([`TEMPLATE.md`](TEMPLATE.md)). Nombre de archivo en inglés, cuerpo en español. Un ADR aceptado no se
edita para cambiar la decisión: se escribe uno nuevo que lo reemplaza y se marca el viejo como
"Reemplazado por NNNN".

## Índice

| # | Decisión | Estado |
|---|---|---|
| [0001](0001-nextjs-static-first-on-vercel.md) | Next.js con páginas estáticas, desplegado en Vercel | Aceptado |
| [0002](0002-posts-as-mdx-in-repo.md) | Los posts son archivos MDX en el repo, validados en el build | Aceptado |
| [0003](0003-engagement-in-redis-anonymous.md) | Visitas, reacciones y comentarios en Redis, anónimos y cargados en el navegador | Aceptado |
| [0004](0004-newsletter-with-resend-double-opt-in.md) | Newsletter propio con Resend y doble confirmación | Reemplazado por 0007 |
| [0005](0005-own-moderated-comments.md) | Comentarios propios, sin login, moderados por correo | Aceptado |
| [0006](0006-lightweight-workflow.md) | Flujo de trabajo liviano: ADR, docs y CLAUDE.md, sin tablero ni trunk-based | Aceptado |
| [0007](0007-newsletter-with-brevo.md) | El newsletter y el correo transaccional pasan de Resend a Brevo | Aceptado |
