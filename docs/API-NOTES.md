# API Notes

## Promoly URL Patterns

### Campaign Report URLs
When working with Promoly campaign reports, use the following URL transformation to access the raw data:

#### Web URL Format (Dashboard View)
```
https://mailer.promo.ly/campaigns/{campaign_id}/{user_id}/report
```

#### API Endpoint Format (Raw Data)
```
https://api.promo.ly/api/admin/shared/campaign/{campaign_id}/{user_id}/feedback
```

### Transformation Rules
1. Replace `mailer.promo.ly/campaigns` with `api.promo.ly/api/admin/shared/campaign`
2. Replace `/report` at the end with `/feedback`
3. Keep the `campaign_id` and `user_id` segments unchanged

### Example
From:
```
https://mailer.promo.ly/campaigns/1d72cb8137bcca01dae17ab4f17e0188/d84dc3e52076ac0172b155739c79f610/report
```

To:
```
https://api.promo.ly/api/admin/shared/campaign/1d72cb8137bcca01dae17ab4f17e0188/d84dc3e52076ac0172b155739c79f610/feedback
```

This endpoint returns campaign feedback data including:
- User ratings and comments
- Subscriber information
- Geographic data
- Play counts and engagement metrics
