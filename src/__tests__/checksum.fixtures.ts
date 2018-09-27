export const checksummedStore = [{
        original: "4BAF5FADA8E5DB92C3D3242618C5B47133AE003C",
        good_no0x:"4BaF5fADa8E5Db92c3D3242618c5b47133Ae003c",
        good:   "0x4BaF5fADa8E5Db92c3D3242618c5b47133Ae003c",
        bad:    "0x4baF5fADa8E5Db92c3D3242618c5b47133Ae003c", // first b is lowercase
    },
    {
        original: "448261915A80CDE9BDE7C7A791685200D3A0BF4E",
        good_no0x:"448261915a80CDe9bde7C7A791685200d3A0BF4e",
        good:   "0x448261915a80CDe9bde7C7A791685200d3A0BF4e",
        bad:    "0x448261915a80cDe9bde7C7A791685200d3A0BF4e", // first c is lowercase
    },
    {
        original: "DED02FD979FC2E55C0243BD2F52DF022C40ADA1E",
        good_no0x:"DED02FD979fC2e55c0243Bd2f52DF022C40aDa1E",
        good:   "0xDED02FD979fC2e55c0243Bd2f52DF022C40aDa1E",
        bad:    "0xdED02FD979fC2e55c0243Bd2f52DF022C40aDa1E", // first d is lowercase
    },
    {
        original: "13F06E60297BEA6A3C402F6F64C416A6B31E586E",
        good_no0x:"13f06E60297bEA6A3C402F6F64c416a6B31e586e",
        good:   "0x13f06E60297bEA6A3C402F6F64c416a6B31e586e",
        bad:    "0x13F06E60297bEA6A3C402F6F64c416a6B31e586e", // first f is uppercase
    },
    {
        original: "1A90C25307C3CC71958A83FA213A2362D859CF33",
        good_no0x:"1a90c25307c3Cc71958A83fa213a2362D859cF33",
        good:   "0x1a90c25307c3Cc71958A83fa213a2362D859cF33",
        bad:    "0x1A90c25307c3Cc71958A83fa213a2362D859cF33", // first a is uppercase
        
    },
    {
        original: "625ABAEBD87DAE9AB128F3B3AE99688813D9C5DF",
        good_no0x:"625aBAEBd87Dae9AB128F3b3ae99688813d9C5Df",
        good:   "0x625aBAEBd87Dae9AB128F3b3ae99688813d9C5Df",
        bad:    "0x625AbAEBd87Dae9AB128F3b3ae99688813d9C5Df", // first A is uppercase, b is lowercase
    },
    {
        original: "36BA34097F861191C48C839C9B1A8B5912F583CF",
        good_no0x:"36BA34097f861191c48c839c9B1A8B5912f583cf",
        good:   "0x36BA34097f861191c48c839c9B1A8B5912f583cf",
        bad:    "0x36bA34097f861191c48c839c9B1A8B5912f583cF", // first b is lowercase, last F is uppercase
    },
    {
        original: "D2453AE76C9A86AAE544FCA699DBDC5C576AEF3A",
        good_no0x:"D2453AE76c9a86AAE544FCa699DBdC5C576aEf3A",
        good:   "0xD2453AE76c9a86AAE544FCa699DBdC5C576aEf3A",
        bad:    "0xd2453aE76c9a86AaE544FCA699DBdC5C576Aef3A", // random lowercase / upperacase
    },
    {
        original: "72220E84947C36118CDBC580454DFAA3B918CD97",
        good_no0x:"72220E84947c36118CDbc580454DfaA3B918cd97",
        good:   "0x72220E84947c36118CDbc580454DfaA3B918cd97",
        bad:    "0x72220e84947C36118cdBC580454dFAa3b918CD97", // inverted cases
    },
    {
        original: "50F92304C892D94A385CA6CE6CD6950CE9A36839",
        good_no0x:"50f92304c892d94A385Ca6ce6cD6950ce9A36839",
        good:   "0x50f92304c892d94A385Ca6ce6cD6950ce9A36839",
        bad:    "0x50F92304c892D94A385Ca6ce6CD6950ce9A36839", // random lowercase / upperacase
    }
];
