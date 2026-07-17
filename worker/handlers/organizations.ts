import type { AuthedRequest, Env } from '../types';
import { badRequest, json, notFound, nowIso, readJson } from '../utils';

interface OrganizationBody {
  name?: string;
  description?: string;
  currency?: string;
}

function toApi(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    currency: row.currency ?? 'USD',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    conversion: undefined as any,
  };
}

// Every user belongs to exactly one organization (their tenant), so "current"
// always resolves via auth.organizationId — there is no cross-org listing.
export async function getCurrent(_request: Request, env: Env, auth: AuthedRequest): Promise<Response> {
  const row = await env.DB.prepare('SELECT * FROM organizations WHERE id = ?').bind(auth.organizationId).first();
  if (!row) return notFound();
  return json(toApi(row));
}

export async function updateCurrent(request: Request, env: Env, auth: AuthedRequest): Promise<Response> {
  const body = await readJson<OrganizationBody>(request);
  const sets: string[] = [];
  const values: unknown[] = [];

  const currentOrg = await env.DB.prepare('SELECT currency FROM organizations WHERE id = ?').bind(auth.organizationId).first() as { currency?: string } | null;
  const oldCurrency = currentOrg?.currency ?? 'USD';
  const newCurrency = body.currency;

  let conversionResult: {
    rate: number;
    oldCurrency: string;
    newCurrency: string;
    rateSource: string;
  } | undefined = undefined;

  if (newCurrency && newCurrency !== oldCurrency) {
    let rate = 1.0;
    let rateSource = 'static fallback';
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${oldCurrency}`);
      if (res.ok) {
        const data = await res.json() as any;
        if (data && data.rates && data.rates[newCurrency]) {
          rate = Number(data.rates[newCurrency]);
          rateSource = 'live Exchange Rate API';
        }
      }
    } catch (err) {
      console.error('Failed to fetch live exchange rates:', err);
    }

    if (rate === 1.0) {
      const staticRates: Record<string, number> = {
        USD: 1.0,
        EUR: 0.92,
        GBP: 0.78,
        PKR: 278.0,
        INR: 83.50,
        AED: 3.67,
        SAR: 3.75,
        CAD: 1.37,
        AUD: 1.50,
        SGD: 1.35
      };
      const baseUSDToOld = staticRates[oldCurrency] ?? 1.0;
      const baseUSDToNew = staticRates[newCurrency] ?? 1.0;
      rate = (1.0 / baseUSDToOld) * baseUSDToNew;
    }

    // Apply conversion to DB
    await env.DB.prepare('UPDATE campaigns SET budget = budget * ? WHERE budget IS NOT NULL AND client_id IN (SELECT id FROM clients WHERE organization_id = ?)')
      .bind(rate, auth.organizationId)
      .run();

    await env.DB.prepare('UPDATE influencers SET price_post = price_post * ?, price_story = price_story * ?, cpa = cpa * ?, cpi = cpi * ?, ltv = ltv * ? WHERE organization_id = ?')
      .bind(rate, rate, rate, rate, rate, auth.organizationId)
      .run();

    await env.DB.prepare('UPDATE analytics_records SET revenue = revenue * ? WHERE revenue IS NOT NULL AND influencer_id IN (SELECT id FROM influencers WHERE organization_id = ?)')
      .bind(rate, auth.organizationId)
      .run();

    conversionResult = {
      rate,
      oldCurrency,
      newCurrency,
      rateSource,
    };
  }

  if ('name' in body) {
    sets.push('name = ?');
    values.push(body.name);
  }
  if ('description' in body) {
    sets.push('description = ?');
    values.push(body.description);
  }
  if ('currency' in body) {
    sets.push('currency = ?');
    values.push(body.currency);
  }
  if (sets.length === 0) return badRequest('No fields to update');

  sets.push('updated_at = ?');
  values.push(nowIso(), auth.organizationId);

  await env.DB.prepare(`UPDATE organizations SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  const row = await env.DB.prepare('SELECT * FROM organizations WHERE id = ?').bind(auth.organizationId).first();
  const apiResponse = toApi(row as Record<string, unknown>);
  if (conversionResult) {
    apiResponse.conversion = conversionResult;
  }
  return json(apiResponse);
}
