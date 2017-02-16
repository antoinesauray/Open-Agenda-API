
exports.buildStatement =  function (insert, rows) {
  const params = []
  const chunks = []
  rows.forEach(row => {
    const valueClause = [];
    const conflictClause = []
    var keys = Object.keys(row);
    keys.forEach(key => {
        var value = row[key];
        params.push(value)
        valueClause.push('$' + params.length)
        conflictClause.push(key+'=$' + params.length)
    });
    chunks.push('(' + valueClause.join(', ') + ')  ON CONFLICT ((more->>\'facebook_id\'), agenda_id) DO UPDATE SET '+ conflictClause.join(', '));
});
  return {
    statement: insert + chunks.join(', '),
    params: params
  }
}
