-- Seed the books that have downloadable excerpts. Slugs are the public identifiers
-- used in excerpt URLs and R2 keys (excerpts/{slug}.pdf). book-1 is in development
-- with no excerpt and is intentionally omitted.

INSERT INTO books (slug, title, excerpt_pdf_key, active) VALUES
  ('beekeeping-advanced',     'Pčelarstvo – Ilustrovani priručnik za napredne pčelare', 'excerpts/beekeeping-advanced.pdf',     1),
  ('queen-rearing',           'Matica – Osmijeh na licu',                                'excerpts/queen-rearing.pdf',           1),
  ('beekeeping-beginners',    'Pčelarstvo – Ilustrovani priručnik za početnike',         'excerpts/beekeeping-beginners.pdf',    1),
  ('beekeeping-journal',      'Beekeeping Journal',                                      'excerpts/beekeeping-journal.pdf',      1),
  ('how-to-say-no',           'How to Say No',                                           'excerpts/how-to-say-no.pdf',           1),
  ('ray-the-smart-kitten',    'The Adventure of Ray the Smart Kitten',                   'excerpts/ray-the-smart-kitten.pdf',    1),
  ('cozy-keys-to-every-room', 'Cozy Keys to Every Room',                                 'excerpts/cozy-keys-to-every-room.pdf', 1);
