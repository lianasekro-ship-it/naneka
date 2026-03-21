-- Seed: Dar es Salaam initial delivery zone
-- Approximate 10km radius polygon centred on Posta (city centre)
-- Coordinates: -6.8160° S, 39.2803° E
--
-- Replace the ST_Buffer approximation below with an exact polygon
-- drawn in QGIS or geojson.io before going to production.

INSERT INTO delivery_zones (name, boundary, is_active)
VALUES (
    'Dar es Salaam — City Zone',
    ST_Buffer(
        ST_SetSRID(ST_MakePoint(39.2803, -6.8160), 4326)::geography,
        10000   -- 10,000 metres = 10 km radius
    ),
    TRUE
);
