import { describe, expect, it } from 'vitest';

import { SDP_SETUP_ROLES } from './device-sync-types';

import type { CompactIceCandidate, CompactSdpFields, SdpSetupRole } from './device-sync-types';

describe('Device Sync Types', () => {
  it('lists all three SdpSetupRole values, in the order the wire encoding indexes by', () => {
    // sdp-compact.ts packs the index into 2 bits and sdp-fields.ts validates
    // against this same array — a reordering here silently changes the wire
    // format both files agree on.
    expect(SDP_SETUP_ROLES).toEqual(['actpass', 'active', 'passive']);
  });

  it('should define CompactIceCandidate keyed by field name', () => {
    const candidate: CompactIceCandidate = {
      type: 'host',
      address: '192.168.1.1',
      port: 5000,
    };

    expect(candidate.type).toBe('host');
    expect(candidate.relatedAddress).toBeUndefined();
  });

  it('should define CompactSdpFields keyed by field name', () => {
    const fields: CompactSdpFields = {
      ufrag: 'abc',
      pwd: 'def',
      fingerprint: new Uint8Array(32),
      setup: 'actpass' satisfies SdpSetupRole,
      candidates: [],
    };

    expect(fields.setup).toBe('actpass');
    expect(fields.fingerprint).toHaveLength(32);
  });
});
