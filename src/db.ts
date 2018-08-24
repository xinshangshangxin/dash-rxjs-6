import * as sqlite3 from 'sqlite3';

interface DashApi {
  type: string;
  name: string;
  path: string;
}

function createDatabase(apiList: DashApi[], dbPath: string) {
  const db = new sqlite3.Database(dbPath);

  db.serialize(() => {
    db.run('CREATE TABLE searchIndex(id INTEGER PRIMARY KEY, name TEXT, type TEXT, path TEXT);');
    db.run('CREATE UNIQUE INDEX anchor ON searchIndex (name,type,path);');

    let stmt = db.prepare(
      'INSERT OR IGNORE INTO ' + 'searchIndex(name, type, path) ' + 'VALUES (?, ?, ?)'
    );

    apiList.forEach(({ name, type, path }) => {
      stmt.run(name, type, path);
    });

    stmt.finalize();
  });

  db.close();
}

export { DashApi, createDatabase };
