//  Copyright (C) 2018 Zilliqa
//
//  This file is part of zilliqa-js
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

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
