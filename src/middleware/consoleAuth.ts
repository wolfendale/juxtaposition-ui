import config from '../../config.json';
import util from '../util';
import { Request, Response, NextFunction } from 'express';

export async function auth(request: Request, response: Response, next: NextFunction): Promise<void> {
	// Get pid and fetch user data
	if (request.session && request.session.user && request.session.pid && !request.isWrite) {
		request.user = request.session.user;
		request.pid = request.session.pid;
	} else {
		request.pid = request.get('x-nintendo-servicetoken') ? await util.processServiceToken(request.get('x-nintendo-servicetoken')) : null;
		request.user = request.pid ? await util.getUserDataFromPid(request.pid) : null;

		request.session.user = request.user;
		request.session.pid = request.pid;
	}

	// Set headers
	const encodedParamPack = request.get('x-nintendo-parampack');
	request.paramPackData = encodedParamPack ? util.decodeParamPack(encodedParamPack) : null;
	response.header('X-Nintendo-WhiteList', config.whitelist);

	if (!request.user) {
		try {
			request.user = await util.getUserDataFromToken(request.cookies.access_token);
			request.pid = request.user.pid;
			if (request.user.accessLevel !== 3) {
				request.user = null;
				request.pid = null;
			}
		} catch (e) {
			console.log(e);
			request.user = null;
			request.pid = null;
		}
	}

	// This section includes checks if a user is a developer and adds exceptions for these cases
	if (!request.pid) {
		return response.render('portal/partials/ban_notification.ejs', {
			user: null,
			error: 'Unable to parse service token. Are you using a Nintendo Network ID?'
		});
	}
	if (!request.user) {
		return response.render('portal/partials/ban_notification.ejs', {
			user: null,
			error: 'Unable to fetch user data. Please try again later.'
		});
	}
	if (request.user.accessLevel < 3 && !request.paramPackData) {
		return response.render('portal/partials/ban_notification.ejs', {
			user: null,
			error: 'Missing auth headers'
		});
	}
	const userAgent = request.get('user-agent');
	if (request.user.accessLevel < 3 && (request.cookies.access_token || (!userAgent?.includes('Nintendo WiiU') && !userAgent?.includes('Nintendo 3DS')))) {
		return response.render('portal/partials/ban_notification.ejs', {
			user: null,
			error: 'Invalid authentication method used.'
		});
	}

	request.lang = util.processLanguage(request?.paramPackData ?? undefined);
	//console.timeEnd(`Time Request ${request.timerDate}`);
	return next();
}

export default {
	auth
};