export const abi = {
  name: 'NonfungibleToken',
  params: [
    {
      name: 'contractOwner',
      type: 'ByStr20',
    },
    {
      name: 'name',
      type: 'String',
    },
    {
      name: 'symbol',
      type: 'String',
    },
  ],
  fields: [
    {
      name: 'tokenOwnerMap',
      type: 'Map (Uint256) (ByStr20)',
    },
    {
      name: 'ownedTokenCount',
      type: 'Map (ByStr20) (Uint256)',
    },
    {
      name: 'tokenApprovals',
      type: 'Map (Uint256) (ByStr20)',
    },
    {
      name: 'operatorApprovals',
      type: 'Map (ByStr20) (Map (ByStr20) (Bool))',
    },
  ],
  transitions: [
    {
      name: 'balanceOf',
      params: [
        {
          name: 'address',
          type: 'ByStr20',
        },
      ],
    },
    {
      name: 'ownerOf',
      params: [
        {
          name: 'tokenId',
          type: 'Uint256',
        },
      ],
    },
    {
      name: 'mint',
      params: [
        {
          name: 'to',
          type: 'ByStr20',
        },
        {
          name: 'tokenId',
          type: 'Uint256',
        },
      ],
    },
    {
      name: 'transferFrom',
      params: [
        {
          name: 'from',
          type: 'ByStr20',
        },
        {
          name: 'to',
          type: 'ByStr20',
        },
        {
          name: 'tokenId',
          type: 'Uint256',
        },
      ],
    },
    {
      name: 'approve',
      params: [
        {
          name: 'to',
          type: 'ByStr20',
        },
        {
          name: 'tokenId',
          type: 'Uint256',
        },
      ],
    },
    {
      name: 'setApprovalForAll',
      params: [
        {
          name: 'to',
          type: 'ByStr20',
        },
        {
          name: 'approved',
          type: 'Bool',
        },
      ],
    },
  ],
  events: [],
};
