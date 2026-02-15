# ĶLUS (3 formas) — 2. uzdevums

## Prasība
Papildināt iepriekšējā uzdevuma formas ar papildus datiem:
- Pievienot `inventars.json` un `vielas.json`
- 3. formā tabulā:
  - poga **Vielas** rāda tikai vielas (no `vielas.json`)
  - poga **Inventārs** rāda tikai inventāru (no `inventars.json`)
  - poga **Rādīt visu** rāda visus ierakstus

## Kā strādā
`script.js` ielādē abus JSON failus ar `fetch()` un apvieno ierakstus vienā masīvā, saglabājot avotu (`_source`), lai var filtrēt.

## Palaišana
Atver kā statisku vietni (Replit / GitHub Pages).  
Ja atver ar `file://`, pārlūks var bloķēt `fetch()`.
