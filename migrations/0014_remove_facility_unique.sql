-- 施設構造物番号の UNIQUE 制約解除
-- SQLiteではALTER TABLE DROP CONSTRAINTができないため、テーブル再作成で行う

CREATE TABLE facilities_new (
    id                TEXT PRIMARY KEY,
    structure_no      TEXT,
    building_use      TEXT,
    managing_group_id TEXT NOT NULL REFERENCES groups(id),
    created_at        INTEGER NOT NULL
);

INSERT INTO facilities_new (id, structure_no, building_use, managing_group_id, created_at)
SELECT id, structure_no, building_use, managing_group_id, created_at FROM facilities;

DROP TABLE facilities;
ALTER TABLE facilities_new RENAME TO facilities;

CREATE INDEX IF NOT EXISTS idx_facility_group ON facilities(managing_group_id);
