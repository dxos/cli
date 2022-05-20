//
// Copyright 2022 DXOS.org
//

export const displayItem = ({ id, type, parent, model }: any) => ({
  id,
  type,
  parent,
  props: JSON.stringify(model.toObject())
});
