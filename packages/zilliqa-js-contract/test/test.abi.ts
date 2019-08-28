export const abi = {
  scilla_major_version: 0,
  vname: 'NonfungibleToken',
  params: [
    {
      vname: 'contractOwner',
      type: 'ByStr20',
    },
    {
      vname: 'name',
      type: 'String',
    },
    {
      vname: 'symbol',
      type: 'String',
    },
  ],
  fields: [
    {
      vname: 'tokenOwnerMap',
      type: 'Map (Uint256) (ByStr20)',
      depth: 1,
    },
    {
      vname: 'ownedTokenCount',
      type: 'Map (ByStr20) (Uint256)',
      depth: 1,
    },
    {
      vname: 'tokenApprovals',
      type: 'Map (Uint256) (ByStr20)',
      depth: 1,
    },
    {
      vname: 'operatorApprovals',
      type: 'Map (ByStr20) (Map (ByStr20) (Bool))',
      depth: 2,
    },
  ],
  transitions: [
    {
      vname: 'balanceOf',
      params: [
        {
          vname: 'address',
          type: 'ByStr20',
        },
      ],
    },
    {
      vname: 'ownerOf',
      params: [
        {
          vname: 'tokenId',
          type: 'Uint256',
        },
      ],
    },
    {
      vname: 'mint',
      params: [
        {
          vname: 'to',
          type: 'ByStr20',
        },
        {
          vname: 'tokenId',
          type: 'Uint256',
        },
      ],
    },
    {
      vname: 'transferFrom',
      params: [
        {
          vname: 'from',
          type: 'ByStr20',
        },
        {
          vname: 'to',
          type: 'ByStr20',
        },
        {
          vname: 'tokenId',
          type: 'Uint256',
        },
      ],
    },
    {
      vname: 'approve',
      params: [
        {
          vname: 'to',
          type: 'ByStr20',
        },
        {
          vname: 'tokenId',
          type: 'Uint256',
        },
      ],
    },
    {
      vname: 'setApprovalForAll',
      params: [
        {
          vname: 'to',
          type: 'ByStr20',
        },
        {
          vname: 'approved',
          type: 'Bool',
        },
      ],
    },
  ],
  events: [],
};
