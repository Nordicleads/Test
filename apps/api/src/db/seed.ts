import { pool } from "./client.js";
import "dotenv/config";

const buildings = [
  {
    name: "Oslo Rådhus",
    nameLocal: "Oslo Rådhus",
    description:
      "Oslo City Hall is one of Norway's most significant modernist buildings, constructed between 1931 and 1950 to designs by Arnstein Arneberg and Magnus Poulsson. The two iconic brick towers dominate the waterfront and house the Nobel Peace Prize ceremony each December. The interior is decorated with monumental murals by Norway's most celebrated artists of the 20th century, depicting Norwegian history, labor, and nature.",
    shortDescription:
      "Modernist twin-towered city hall hosting the Nobel Peace Prize ceremony, adorned with monumental Norwegian murals.",
    architect: "Arnstein Arneberg, Magnus Poulsson",
    yearBuilt: 1931,
    yearCompleted: 1950,
    address: "Rådhusplassen 1, 0037 Oslo",
    city: "Oslo",
    lat: 59.9127,
    lng: 10.7351,
    categories: ["civic", "landmark", "modernist"],
    era: "modernist",
    sources: ["manual"],
  },
  {
    name: "Operahuset",
    nameLocal: "Den Norske Opera & Ballett",
    description:
      "The Oslo Opera House opened in 2008 and immediately became the defining architectural landmark of post-industrial Oslo. Designed by Snøhetta, the building's sloping white marble and granite roof extends into the Oslofjord, inviting the public to walk across its surface. It won the Mies van der Rohe Award in 2009. The angled form references the Norwegian landscape — a glacier meeting the sea.",
    shortDescription:
      "Snøhetta's landmark opera house with a walkable marble roof sloping into the Oslofjord. Mies van der Rohe Award 2009.",
    architect: "Snøhetta",
    yearBuilt: 2000,
    yearCompleted: 2008,
    address: "Kirsten Flagstads Plass 1, 0150 Oslo",
    city: "Oslo",
    lat: 59.9075,
    lng: 10.7530,
    categories: ["new_build", "landmark", "civic"],
    era: "contemporary",
    sources: ["manual"],
  },
  {
    name: "Akershus Festning",
    nameLocal: "Akershus Festning",
    description:
      "Akershus Fortress is a medieval castle built around 1300 by King Haakon V to protect Oslo from enemy attack. Over the centuries it has served as royal residence, prison, and military headquarters. Today it guards one of Oslo's finest waterfront views. The grounds contain the Norwegian Resistance Museum and the mausoleum of Norway's royal family.",
    shortDescription:
      "Medieval fortress from c.1300 overlooking the Oslofjord — royal mausoleum, resistance museum, and some of Oslo's best views.",
    architect: null,
    yearBuilt: 1299,
    yearCompleted: 1308,
    address: "Festningsplassen, 0150 Oslo",
    city: "Oslo",
    lat: 59.9074,
    lng: 10.7369,
    categories: ["medieval", "landmark"],
    era: "medieval",
    sources: ["manual"],
  },
  {
    name: "Nasjonalmuseet",
    nameLocal: "Nasjonalmuseet",
    description:
      "The National Museum of Norway opened in 2022 as Europe's largest museum of art, architecture, and design. Designed by the German firm Kleihues + Schuwerk, the building is a disciplined, monumental sandstone and glass structure at Aker Brygge. It replaced the scattered collection across several historic buildings and unifies Norway's national art collection under one roof.",
    shortDescription:
      "Europe's largest art and design museum, opened 2022. Kleihues + Schuwerk's monumental sandstone building at Aker Brygge.",
    architect: "Kleihues + Schuwerk",
    yearBuilt: 2016,
    yearCompleted: 2022,
    address: "Brynjulf Bulls Plass 3, 0250 Oslo",
    city: "Oslo",
    lat: 59.9138,
    lng: 10.7286,
    categories: ["new_build", "civic", "landmark"],
    era: "contemporary",
    sources: ["manual"],
  },
  {
    name: "Astrup Fearnley Museet",
    nameLocal: "Astrup Fearnley Museet",
    description:
      "The Astrup Fearnley Museum of Modern Art was designed by Renzo Piano and opened in 2012 on the Tjuvholmen peninsula. The building's two pavilions are unified under a sweeping glass sail roof that references Oslo's maritime culture. Piano's characteristic lightness and attention to natural light creates an interior perfectly calibrated for contemporary art.",
    shortDescription:
      "Renzo Piano's glass-sailed contemporary art museum on the Tjuvholmen peninsula — architecture as sculpture.",
    architect: "Renzo Piano Building Workshop",
    yearBuilt: 2009,
    yearCompleted: 2012,
    address: "Strandpromenaden 2, 0252 Oslo",
    city: "Oslo",
    lat: 59.9101,
    lng: 10.7225,
    categories: ["new_build", "landmark"],
    era: "contemporary",
    sources: ["manual"],
  },
  {
    name: "Deichmanske bibliotek Bjørvika",
    nameLocal: "Deichmanske bibliotek Bjørvika",
    description:
      "Oslo's new main library opened in 2020 in the Bjørvika waterfront district, designed by Lund Hagem and Atelier Oslo. The building's perforated aluminium facade wraps a light-filled interior of stacked terraced floors. It is deliberately open and democratic — a public living room for the city. The library sits at the heart of the new cultural axis between the Opera House and Munchmuseet.",
    shortDescription:
      "Lund Hagem and Atelier Oslo's perforated aluminium library — a democratic public living room in the Bjørvika cultural axis.",
    architect: "Lund Hagem Arkitekter, Atelier Oslo",
    yearBuilt: 2015,
    yearCompleted: 2020,
    address: "Arne Garborgs Plass 4, 0179 Oslo",
    city: "Oslo",
    lat: 59.9085,
    lng: 10.7567,
    categories: ["new_build", "civic"],
    era: "contemporary",
    sources: ["manual"],
  },
  {
    name: "Munchmuseet",
    nameLocal: "Munchmuseet",
    description:
      "The Munch Museum opened in 2021 on Oslo's waterfront, designed by Estudio Herreros. The 13-storey tower leans dramatically over the Oslofjord, its perforated metal facade changing character throughout the day. The building was controversial during planning — its height breaks the waterfront skyline — but its ambition matches Edvard Munch's own restless artistic vision.",
    shortDescription:
      "Estudio Herreros' dramatic leaning tower on the Oslofjord, housing the world's largest collection of Munch's work.",
    architect: "Estudio Herreros",
    yearBuilt: 2012,
    yearCompleted: 2021,
    address: "Edvard Munchs Plass 1, 0194 Oslo",
    city: "Oslo",
    lat: 59.9058,
    lng: 10.7575,
    categories: ["new_build", "landmark", "civic"],
    era: "contemporary",
    sources: ["manual"],
  },
  {
    name: "Nationaltheatret",
    nameLocal: "Nationaltheatret",
    description:
      "The National Theatre of Norway was designed by Henrik Bull and opened in 1899. Its neoclassical facade, colonnaded entrance, and green copper dome are among the most recognisable architectural features of central Oslo. The building sits between the Royal Palace gardens and the university campus, anchoring the cultural heart of the city.",
    shortDescription:
      "Henrik Bull's 1899 neoclassical theatre — green copper dome and colonnaded facade at the heart of central Oslo.",
    architect: "Henrik Bull",
    yearBuilt: 1891,
    yearCompleted: 1899,
    address: "Johanne Dybwads Plass 1, 0161 Oslo",
    city: "Oslo",
    lat: 59.9137,
    lng: 10.7326,
    categories: ["civic", "landmark"],
    era: "neoclassical",
    sources: ["manual"],
  },
  {
    name: "Universitetet i Oslo — Domus Bibliotheca",
    nameLocal: "Domus Bibliotheca",
    description:
      "The University of Oslo's Domus Bibliotheca, built between 1851 and 1854, is a neoclassical masterpiece by Christian Heinrich Grosch. Its Doric-columned portico and symmetrical wings set the architectural tone for the entire Karl Johans Gate axis. The university aula contains Edvard Munch's monumental murals, including 'The Sun', commissioned for the building's centennial celebrations.",
    shortDescription:
      "Grosch's 1854 neoclassical university library — Doric columns anchoring the Karl Johans axis, Munch murals inside.",
    architect: "Christian Heinrich Grosch",
    yearBuilt: 1851,
    yearCompleted: 1854,
    address: "Karl Johans gate 47, 0162 Oslo",
    city: "Oslo",
    lat: 59.9160,
    lng: 10.7347,
    categories: ["civic", "landmark"],
    era: "neoclassical",
    sources: ["manual"],
  },
  {
    name: "Barcode — DNB-bygget",
    nameLocal: "DNB-bygget, Barcode",
    description:
      "The Barcode project is a row of high-density mixed-use towers along Dronning Eufemias gate in Bjørvika, developed between 2005 and 2016. Each building was designed by a different architectural firm — Dark, MVRDV, Dark+Link, LPO, and others — creating a deliberate variety in skin, rhythm, and silhouette. The project is polarising: critics call it a wall blocking the city from its fjord; supporters see it as urbanism at Norwegian scale.",
    shortDescription:
      "A sequence of individually designed towers by MVRDV, Dark, and others — Oslo's most debated urban development.",
    architect: "MVRDV, Dark Arkitekter, LPO Arkitekter",
    yearBuilt: 2005,
    yearCompleted: 2016,
    address: "Dronning Eufemias gate 30, 0191 Oslo",
    city: "Oslo",
    lat: 59.9063,
    lng: 10.7600,
    categories: ["new_build", "transformation"],
    era: "contemporary",
    sources: ["manual"],
  },
  {
    name: "Oslo Børs",
    nameLocal: "Oslo Børs",
    description:
      "Oslo Stock Exchange was designed by Christian Heinrich Grosch and completed in 1828, making it one of the oldest buildings in central Oslo still in active use. Its neoclassical facade with Ionic pilasters was a deliberate statement of mercantile confidence. The building has been extended and modified over the decades but its original street presence remains largely intact.",
    shortDescription:
      "Grosch's 1828 neoclassical stock exchange — one of Oslo's oldest public buildings still in active use.",
    architect: "Christian Heinrich Grosch",
    yearBuilt: 1826,
    yearCompleted: 1828,
    address: "Tollbugata 2, 0152 Oslo",
    city: "Oslo",
    lat: 59.9100,
    lng: 10.7377,
    categories: ["civic", "landmark"],
    era: "neoclassical",
    sources: ["manual"],
  },
  {
    name: "Aker Brygge",
    nameLocal: "Aker Brygge",
    description:
      "Aker Brygge is a former shipyard transformed into a mixed-use waterfront district between 1982 and 1998. The transformation project, designed primarily by Lund & Slaatto, retained the historic wharf halls and crane structures while inserting residential, commercial, and cultural uses. It became the model for Oslo's ongoing fjord city strategy and remains one of Scandinavia's most successful brownfield transformations.",
    shortDescription:
      "A former 1980s shipyard transformed into Oslo's waterfront hub — Lund & Slaatto's template for the entire fjord city strategy.",
    architect: "Lund & Slaatto Arkitekter",
    yearBuilt: 1982,
    yearCompleted: 1998,
    address: "Stranden 1, 0250 Oslo",
    city: "Oslo",
    lat: 59.9108,
    lng: 10.7269,
    categories: ["transformation", "landmark"],
    era: "postmodern",
    sources: ["manual"],
  },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let inserted = 0;
    let skipped = 0;

    for (const b of buildings) {
      const existing = await client.query(
        "SELECT id FROM buildings WHERE name = $1 AND city = $2",
        [b.name, b.city]
      );
      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }

      await client.query(
        `INSERT INTO buildings (
          name, name_local, description, short_description,
          architect, year_built, year_completed,
          address, city, country,
          location, categories, era, sources, is_verified
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7,
          $8, $9, 'NO',
          ST_SetSRID(ST_MakePoint($11, $10), 4326)::geography,
          $12::building_category[], $13::building_era, $14::data_source[],
          true
        )`,
        [
          b.name,
          b.nameLocal,
          b.description,
          b.shortDescription,
          b.architect,
          b.yearBuilt,
          b.yearCompleted,
          b.address,
          b.city,
          b.lat,
          b.lng,
          `{${b.categories.join(",")}}`,
          b.era,
          `{${b.sources.join(",")}}`,
        ]
      );
      inserted++;
    }

    await client.query("COMMIT");
    console.log(`Seed complete — ${inserted} inserted, ${skipped} skipped.`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
