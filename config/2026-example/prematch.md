# Scouter & Team Info

- Scouter Initials `type:text` `code:s` `role:scouter` `size:5` `maxSize:5` required

- Event Code `type:text` `code:e` `role:event` `default:2026micmp3` required

- Match Level `type:choice` `code:l` `role:level` `default:qm` required
  - qm | Qualification
  - sf | Semifinal
  - f | Final

- Match # `type:number` `code:m` `role:match` `min:1` `max:150` required

- Robot `type:choice` `code:r` `role:robot` required
  - r1 | Red 1
  - b1 | Blue 1
  - r2 | Red 2
  - b2 | Blue 2
  - r3 | Red 3
  - b3 | Blue 3

- Team # `type:number` `code:t` `role:team` `min:1` `max:99999`
