**EBMUD Water Group \- interest in SQL Web viewer**  
**January 11, 2026**

* Casey LeBlanc \- Manager of Operations and Maintenance Planning  
* Wendy Ly \- acting supervisor  
* Sutro \- Adam & Max

# Goal

to help provide access to legacy data and information across various systems:

# Agenda

* **EBMUD Water’s legacy data needs \+ drivers:** what must remain easily searchable for day-to-day ops and public records/risk ([*hydrant inspections*](https://www.google.com/search?sca_esv=ae73bb3e4be7be75&sxsrf=ANbL-n6n7qVYwi5DNqzytj5TJ8MRq9ZSww:1768196100616&udm=2&fbs=ADc_l-aN0CWEZBOHjofHoaMMDiKpaEWjvZ2Py1XXV8d8KvlI3o6iwGk6Iv1tRbZIBNIVs-5-bUj3iBl-UxHsANYwOkWWQqZAJJdwuRaSoLHfELMHAQFneUwKM50jpvR3lgPoPKPocSAVLVIC1tmtj18NQh34sJoMKkeMLmVT0BQXR6brJvbElwncIYMxPc2e7aIP7xyAYnsJEw_6y0zcNxiTmikcViftsA&q=example+hydrant+inspection+record&sa=X&ved=2ahUKEwiSwuHjo4WSAxWhL0QIHR5CJlAQtKgLegQIEBAB&biw=1674&bih=1079&dpr=1&aic=0)*, [valve exercising](https://www.google.com/search?q=example+water+pipeline+system+valve+exercising+records&sca_esv=ae73bb3e4be7be75&udm=2&biw=1674&bih=1079&aic=0&sxsrf=ANbL-n5b7c19ms7qBYZlCgynLsWKEf0pbA%3A1768196219578&ei=e4hkabj2Iv6ekPIP94rc8QI&ved=0ahUKEwj4n76cpIWSAxV-D0QIHXcFNy4Q4dUDCBI&uact=5&oq=example+water+pipeline+system+valve+exercising+records&gs_lp=Egtnd3Mtd2l6LWltZyI2ZXhhbXBsZSB3YXRlciBwaXBlbGluZSBzeXN0ZW0gdmFsdmUgZXhlcmNpc2luZyByZWNvcmRzSKcmUOwPWJcbcAN4AJABAJgBQaAB-wGqAQE0uAEDyAEA-AEBmAIAoAIAmAMAiAYBkgcAoAe0AbIHALgHAMIHAMgHAIAIAA&sclient=gws-wiz-img), main break history/claims, [as-builts](https://archivesonline.wcc.govt.nz/nodes/view/856749), reports/docs*) and who uses it  
  * What format are these records in? \- PDF scans, MS Access database  
* **SQL web viewer approach:** how a secure legacy reference/search layer would work on top of existing Oracle/SQL repositories (and help sunset Cold Fusion interfaces) without forcing full migration into Cityworks  
* **Pilot \+ onsite demo plan:** pick one small Water use case (ex: hydrant/valve/main break record retrieval), confirm access/data sources, define success criteria and next steps  
  * Ease of legacy data access for end users

# Demo Scenario: Main break claim \+ records pull

EBMUD gets a call at 2 am because a water main has erupted in downtown Oakland. The dispatcher needs to notify staff on-call and will help coordinate record access. Find everything we know about a main break at Location X from the last 10 years for risk management / public records.

* Original construction record drawings (Mylar drawings, construction field notes, contract specs)  
* valve turning  
* Hydrant flushing  
* Pressure zone/subarea and critical users to notify (ex. Hospitals, schools, nursing homes)  
* Historic flow rates  
* water bodies/catch basins flow will discharge to

## Demo: Asset ID → 10-year narrative summary (hydrant or valve)

Hydrant HYD-\#\#\#\#: summarize last 10 years of inspections, maintenance, related work orders, and attached docs.  
Shows (in a chat-style output):

* Asset header: ID, location text (as stored), status, critical attributes  
* Last inspection: date, result, notes  
* Last maintenance/work orders: dates, descriptions, crews, outcomes  
* Attachments/documents: as-builts, PDFs, photos, scans (as a simple list of links)  
* Source trail: which systems each item came from (Oracle tables, document repository, legacy app export)  
* Optional: export to a simple public-records-ready package (summary \+ index of records)

## Demo \- more robust Start from a simple input: address or nearby intersection (optionally GIS click or polygon if available).

* Filter by time range (ex: last 10 years) \+ asset types (main, valves, hydrants) \+ event type (main break, leak repair, claim).  
* Return a single results page that stitches together:  
  * Work orders / repair records  
  * Hydrant inspection history nearby  
  * Valve exercise records in the affected area  
    Related documents (as-builts, PDF reports, photos, videos, scans)  
* Click into one record to show the detail view \+ attachments.  
* Show a permissions or role-based view (ex: field vs supervisor vs analyst).  
* Export/share package for records response: a link or a bundled export (PDF/CSV \+ attachments list) with a basic audit trail (who accessed/exported, when).

