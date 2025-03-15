# Japanese Jazz Feed for BlueSky

This is a custom BlueSky feed generator focused on Japanese jazz content. The feed filters posts related to Japanese jazz artists, jazz kissa (jazz cafes), and Japanese jazz labels.

This project is based on https://github.com/bluesky-social/feed-generator

## What's Included in the Feed

The feed includes posts that mention:

### Hashtags
- #jjazz
- #japanesejazz
- #jazzkissa
- And other related hashtags

### Japanese Keywords
- ジャズ喫茶 (Jazz kissa)
- ジャズ (Jazz)
- 日本のジャズ (Japanese jazz)

### Japanese Jazz Artists
The feed includes mentions of notable Japanese jazz musicians across various instruments and styles. Examples include:

- Toshiko Akiyoshi (秋吉敏子)
- Ryo Fukui (福居良)
- Hiromi Uehara (上原ひろみ)
- Terumasa Hino (日野皓正)
- Sadao Watanabe (渡辺貞夫)

...and many other influential Japanese jazz artists.

### Japanese Jazz Labels
Posts mentioning Japanese jazz record labels are included, such as:

- Three Blind Mice
- East Wind
- Nippon Columbia
- Deep Jazz Reality

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- Yarn
- A BlueSky account

### Installation

1. Clone this repository:
```bash
git clone https://github.com/iangmaia/bluesky-japanese-jazz-feed
cd bluesky-japanese-jazz-feed
```

2. Install dependencies:
```bash
yarn install
```

3. Create a `.env` file based on the `.env.example`:
```bash
cp .env.example .env
```

4. Edit the `.env` file with your configuration:
```
FEEDGEN_PORT=3000
FEEDGEN_LISTENHOST="localhost"
FEEDGEN_SQLITE_LOCATION="db.sqlite"
FEEDGEN_SUBSCRIPTION_ENDPOINT="wss://bsky.network"
FEEDGEN_HOSTNAME="your-domain.com"
FEEDGEN_PUBLISHER_DID="did:plc:your_did_here"
FEEDGEN_SUBSCRIPTION_RECONNECT_DELAY=3000
```

### Running the Feed Generator

1. Start the server:
```bash
yarn start
```

2. Publish your feed to BlueSky:
```bash
yarn publishFeed
```

Follow the prompts to enter your BlueSky credentials and feed information.

### Deployment

For production deployment, you'll need:

1. A server with a public IP address
2. A domain name pointing to your server
3. SSL certificate (Let's Encrypt is recommended)

## Customization

You can customize the feed by editing the following files:

- `src/subscription.ts`: Modify the keywords and filtering logic
- `src/algos/japanese-jazz.ts`: Adjust the feed algorithm

## Contributing

Feel free to contribute to this project by adding more Japanese jazz artists, labels, or improving the filtering logic.

## License

MIT
