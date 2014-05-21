# s3 Source for Aurora.js

Constructor takes a JSON object with parameters:

	{
		a: [accessKeyId],
		ex: [epiryDate], //toUTCString
		res: [resourcePath],
		head: [headStringToSign],
		get: [getStringToSign]
	}

Also added Asset.fromAWS and Player.fromAWS which take the same settings JSON.
