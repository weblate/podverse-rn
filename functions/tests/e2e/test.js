const wd = require('wd');
const assert = require('assert');
const { performance } = require('perf_hooks')
const asserters = wd.asserters;
const request = require('request');
require('dotenv').config()

const capabilities = process.env.DEVICE_TYPE === 'Android' ?
  {
    'device': 'Google Pixel 3',
    'os_version': '9.0'
  } :
  {
    'device': 'iPhone 11 Pro Max',
    'os_version': '13.0'
  }

Object.assign(capabilities, {
    'browserstack.user': process.env.BROWSERSTACK_USER,
    'browserstack.key': process.env.BROWSERSTACK_KEY,
    'project': `Mobile App - ${process.env.DEVICE_TYPE}`,
    'build': `${process.env.DEVICE_TYPE}`,
    'name': `${process.env.DEVICE_TYPE}`,
    'app': process.env.BROWSERSTACK_APP
});

driver = wd.promiseRemote("http://hub-cloud.browserstack.com/wd/hub");

let windowSize

const elementByIdAndClickAndTest = async (id, waitForElementId, back) => {
    logPerformance(id, 'START')
    await driver.waitForElementByAccessibilityId(id, 10000)
    const element = await driver.elementByAccessibilityId(id)
    await element.click()
    await driver.waitForElementByAccessibilityId(waitForElementId, 10000)
    if (back) await driver.back()
    logPerformance(id, 'END')
}

const elementbyIdClick = async (id) => {
    logPerformance(id, 'START')
    await driver.waitForElementByAccessibilityId(id, 10000)
    const element = await driver.elementByAccessibilityId(id)
    await element.click()
    logPerformance(id, 'END')

}

const sendKeysToElementByID = async (id, textString) => {
    logPerformance(id, 'START')
    await driver.waitForElementByAccessibilityId(id, 10000)
    const element = await driver.elementByAccessibilityId(id);
    await element.sendKeys(textString)
    logPerformance(id, 'END')
}

const getCenterCoordinates = (offsetX = 0, offsetY = 0) => {
    return {
        x: (windowSize.width / 2) + offsetX,
        y: (windowSize.height / 2) + offsetY
    }
}

const performScrollDown = async () => {
  const action = new wd.TouchAction(driver)
  action.press(getCenterCoordinates())
  action.wait(1000)
  action.moveTo(getCenterCoordinates(0, -500))
  action.release()
  await action.perform()
}

/*
All test IDs should be present via one of these options
testID=
testProps(

  Send keys to the username and password input on LoginScreen
  Press submit button on LoginScreen
  Come up with an invalid username/password test
  Test that the Sign Up page shows
  Test that the Reset Password page shows
  Test More button on individual items (clips, podcasts)
*/

const logPerformance = (subject, stage, notes = '') => {
    console.log(subject + ',' + stage + ',' + Math.ceil(performance.now()).toString() + 'ms' + (notes ? ',' + notes + ',' : ''))
}

const postSlackNotification = async (text, opts) => {
  if (process.env.SLACK_WEBHOOK) {
    return request.post(opts.webhook || process.env.SLACK_WEBHOOK, {
      json: { text: `${text} - ${opts.device_type || process.env.DEVICE_TYPE}` }
    })
  }
}

const goBack = true

const runTests = async (customCapabilities) => {
  Object.assign(capabilities, customCapabilities)

  const slackOpts = {
    device_type: capabilities.name,
    webhook: capabilities.webhook
  }

  try {

    await postSlackNotification('Start e2e tests', slackOpts)
        
    console.log('init testing')
    
    await driver.init(capabilities)

    windowSize = await driver.getWindowSize()

    await driver.sleep(3000)

    await driver.waitForElementByAccessibilityId('alert_yes_allow_data')
    await elementByIdAndClickAndTest('alert_yes_allow_data', 'podcasts_screen_view')
    await elementByIdAndClickAndTest('podcasts_screen_podcast_item_0', 'podcast_screen_view', goBack)

    await elementByIdAndClickAndTest('podcasts_screen_podcast_item_1', 'podcast_screen_view')
    await elementByIdAndClickAndTest('podcast_screen_episode_item_0', 'episode_screen_view', goBack)
    await driver.back()

    await elementByIdAndClickAndTest('tab_episodes_screen', 'episodes_screen_view')
    await elementByIdAndClickAndTest('episodes_screen_episode_item_0', 'episode_screen_view', goBack)

    await elementByIdAndClickAndTest('tab_clips_screen', 'clips_screen_view')

    await elementByIdAndClickAndTest('tab_queue_screen', 'queue_screen_view')

    await elementByIdAndClickAndTest('tab_more_screen', 'more_screen_view')
    await elementByIdAndClickAndTest('more_screen_login_cell', 'auth_screen_sign_up_button')
    await sendKeysToElementByID('login_email_text_input', 'TestEmail@ThisIsATest.com')
    await sendKeysToElementByID('login_password_text_input', 'testPASS1!')

    // await elementbyIdClick('login_submit')

    await elementByIdAndClickAndTest('auth_screen_sign_up_button', 'membership_screen_view', goBack)


    await elementByIdAndClickAndTest('more_screen_login_cell', 'auth_screen_sign_up_button')
    await elementByIdAndClickAndTest('auth_screen_reset_password_button', 'reset_password_submit', goBack)

    await elementByIdAndClickAndTest('nav_search_icon', 'search_screen_view')
    await elementByIdAndClickAndTest('nav_dismiss_icon', 'more_screen_view')

    await elementByIdAndClickAndTest('more_screen_downloads_cell', 'downloads_screen_view', goBack)

    // await elementByIdAndClickAndTest('more_screen_playlists_cell', 'playlists_screen_view', goBack)

    // await elementByIdAndClickAndTest('more_screen_profiles_cell', 'profiles_screen_view', goBack)

    // await elementByIdAndClickAndTest('more_screen_my_profile_cell', 'profile_screen_view', goBack)

    await elementByIdAndClickAndTest('more_screen_settings_cell', 'settings_screen_view', goBack)

    await elementByIdAndClickAndTest('more_screen_membership_cell', 'membership_screen_view', goBack)

    await elementByIdAndClickAndTest('more_screen_add_podcast_by_rss_cell', 'add_podcast_by_rss_screen_view')
    await elementByIdAndClickAndTest('nav_dismiss_icon', 'more_screen_view')

    await performScrollDown()

    await elementByIdAndClickAndTest('more_screen_faq_cell', 'faq_screen_view', goBack)

    await elementByIdAndClickAndTest('more_screen_terms_of_service_cell', 'terms_of_service_screen_view', goBack)

    await elementByIdAndClickAndTest('more_screen_about_cell', 'about_screen_view', goBack)

    await driver.sleep(3000)

    await postSlackNotification('SUCCESS: End e2e tests', slackOpts)
  } catch (error) {
    console.log('runTests error: ', error)
    await postSlackNotification(`FAILURE: End e2e tests. Hint: ${error.message || error.data || error}`, slackOpts)
    throw error
  }

  await driver.quit()
}

module.exports = { runTests }
