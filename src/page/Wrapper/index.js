import React, { Component } from "react";
import { Container, Button, Form } from 'react-bootstrap'

import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import dayjs from 'dayjs';
import Web3 from 'web3';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import _ from 'lodash';

import { connect, sign, formToast, getAirdropData, config, formatBalance, getClaimsInfo, getTokenBalance, buildInGenesis } from './utils'
import archorsComponent from '../../components/anchorsComponent'
import { withTranslation } from "react-i18next";
import i18n from '../../locales/i18n';

import styles from "./style.module.scss";
import darwiniaLogo from './img/darwinia-logo.png';
import step1open from './img/step-1-open.png';
import step2open from './img/step-2-open.png';
import step2close from './img/step-2-close.png';
import step3open from './img/step-3-open.png';
import step3close from './img/step-3-close.png';
import promoteLogo from './img/promote-logo.png';
import helpLogo from './img/help-icon.png';
import labelTitleLogo from './img/label-title-logo.png';

import acalaIcon from './img/chain-logo/acala.png';
import crabIcon from './img/chain-logo/crab.png';
import darwiniaIcon from './img/chain-logo/darwinia.png';
import ethereumIcon from './img/chain-logo/ethereum.png';
import kusamaIcon from './img/chain-logo/kusama.png';
import polkadotIcon from './img/chain-logo/polkadot.png';
import tronIcon from './img/chain-logo/tron.png';

import chainMap from './chain';
import check from "@polkadot/util-crypto/address/check";
import CrossChain from '../CrossChain';
import Claim from '../Claims';

import anime from 'animejs';

const chainIcons = {
    acala: acalaIcon,
    crab: crabIcon,
    darwinia: darwiniaIcon,
    ethereum: ethereumIcon,
    kusama: kusamaIcon,
    polkadot: polkadotIcon,
    tron: tronIcon
}

class Claims extends Component {
    constructor(props, context) {
        super(props, context);
        this.state = {
            status: 0,
            networkType: 'eth',
            tokenType: 'ring',
            account: {
                eth: '',
                tron: ''
            },
            signature: '',
            darwiniaAddress: '',
            airdropNumber: Web3.utils.toBN(0),
            claimAmount: Web3.utils.toBN(0),
            claimTarget: '',
            hasFetched: false,
            checkedBall: '',
            relatedBall: [],
            from: 'ethereum',
            to: 'darwinia',
            ringBalance: Web3.utils.toBN(0),
            ktonBalance: Web3.utils.toBN(0),
            crossChainBalance: Web3.utils.toBN(0),
            renderPage: 'crosschain'
        }
    }

    componentDidMount() {
        archorsComponent()
        // anime({
        //     targets: '.animeBg',
        //     scale: 1.03,
        //     easing: 'easeInOutQuad',
        //     direction: 'alternate',
        //     loop: true,
        // })
    }

    setValue = (key, event, fn) => {
        const encoded = fn(event.target.value);
        this.setState({
            [key]: fn ? fn(event.target.value) : event.target.value
        })
        event.persist()
    }

    toWeiBNMiddleware = (num = 0, unit='ether') => {
        try {
            if(num) {
                return Web3.utils.toBN(Web3.utils.toWei(num, unit))
            }
        } catch (error) {
            console.log(error)
            // return Web3.utils.toWei(Web3.utils.toBN('0'))
        }
    }

    toClaims = (status = 2) => {
        const { networkType, account } = this.state;
        const { t } = this.props;
        connect(networkType, (_networkType, _account) => {
            this.setState({
                account: {
                    ...account,
                    [_networkType]: _account
                }
            }, async () => {
                if (this.state.account[_networkType]) {
                    this.setState({
                        status: status
                    })
                    this.airdropData()
                    if(status === 4) {
                        this.queryClaims()
                    }
                    
                    const balances = await getTokenBalance(this.state.account[networkType]);
                    this.setState({
                        ringBalance: Web3.utils.toBN(balances[0]),
                        ktonBalance: Web3.utils.toBN(balances[1]),

                    })
                }
            })
        }, t);
    }

    sign = async () => {
        const { networkType, account, darwiniaAddress } = this.state;
        const { t } = this.props;
        sign(networkType, account[networkType], darwiniaAddress, (signature) => {
            this.setState({
                signature: signature,
                status: 3
            })
        }, t)
    }

    buildInGenesis = () => {
        const { networkType, account, darwiniaAddress, crossChainBalance, tokenType } = this.state;
        const { t } = this.props;
        buildInGenesis(networkType, account[networkType], {
            to: darwiniaAddress,
            value: crossChainBalance,
            tokenType
        }, (signature) => {
            // this.setState({
            //     signature: signature,
            //     status: 3
            // })
        }, t)
    }

    onCopied = () => {
        const { t } = this.props
        formToast(t('crosschain:Copied'))
    }

    toResult = () => {
        this.toClaims(4)
    }

    async queryClaims() {
        const { networkType, account } = this.state;
        const address = networkType === 'eth' ? account[networkType] : (window.tronWeb && window.tronWeb.address.toHex(account[networkType]))
        let json = await getClaimsInfo({
            query: { address: address },
            method: "post"
        });
        if (json.code === 0) {

            if (json.data.info.length === 0) {
                json = {
                    data: {
                        info: [{
                            account: '',
                            target: '',
                            amount: '0'
                        }]
                    }
                }
            };

            this.setState({
                claimAmount: Web3.utils.toBN(json.data.info[0].amount),
                claimTarget: json.data.info[0].target,
                hasFetched: true,
            })
        } else {
        }
    }

    goBack = (status = 1) => {
        if (status === 1) {
            this.setState({
                hasFetched: false
            })
        }
        this.setState({
            status: status
        })
    }

    airdropData = () => {
        const { networkType, account } = this.state;
        const airdropNumber = getAirdropData(networkType, account[networkType]);
        this.setState({
            airdropNumber: airdropNumber
        })
    }

    changeLng = lng => {
        const { i18n } = this.props;
        i18n.changeLanguage(i18n.language.indexOf('en') > -1 ? 'zh-cn' : 'en-us');
        localStorage.setItem("lng", lng);
    }

    renderHeader = () => {
        const { status } = this.state;
        const { t } = this.props
        return (
            <>
                {status === 1 ? <div className={styles.stepBox}>
                    <div className={styles.stepBoxItem}>
                        <img alt="" src={step1open} />
                        <p>{t('crosschain:step_1')}</p>
                    </div>
                    <div className={styles.dotsOpen}></div>
                    <div className={styles.stepBoxItem}>
                        <img alt="" src={step2close} />
                        <p>{t('crosschain:step_2')}</p>
                    </div>
                    <div className={styles.dotsClose}></div>
                    <div className={styles.stepBoxItem}>
                        <img alt="" src={step3close} />
                        <p>{t('crosschain:step_3')}</p>
                    </div>
                </div> : null}
                {status === 2 ? <div className={styles.stepBox}>
                    <div className={styles.stepBoxItem}>
                        <img alt="" src={step1open} />
                        <p>{t('crosschain:step_1')}</p>
                    </div>
                    <div className={styles.dotsOpen}></div>
                    <div className={styles.stepBoxItem}>
                        <img alt="" src={step2open} />
                        <p>{t('crosschain:step_2')}</p>
                    </div>
                    <div className={styles.dotsClose}></div>
                    <div className={styles.stepBoxItem}>
                        <img alt="" src={step3close} />
                        <p>{t('crosschain:step_3')}</p>
                    </div>
                </div> : null}
                {status === 3 ? <div className={styles.stepBox}>
                    <div className={styles.stepBoxItem}>
                        <img alt="" src={step1open} />
                        <p>{t('crosschain:step_1')}</p>
                    </div>
                    <div className={styles.dotsOpen}></div>
                    <div className={styles.stepBoxItem}>
                        <img alt="" src={step2open} />
                        <p>{t('crosschain:step_2')}</p>
                    </div>
                    <div className={styles.dotsOpen}></div>
                    <div className={styles.stepBoxItem}>
                        <img alt="" src={step3open} />
                        <p>{t('crosschain:step_3')}</p>
                    </div>
                </div> : null}
                {status === 4 ? <div className={`${styles.stepBox} ${styles.stepResultBox}`}>
                    <div className={styles.stepBoxItem}>
                        <img alt="" src={step1open} />
                        <p>{t('crosschain:step_1')}</p>
                    </div>
                    <div className={styles.dotsOpen}></div>
                    <div className={styles.stepBoxItem}>
                        <img alt="" src={step3open} />
                        <p>{t('crosschain:Result')}</p>
                    </div>
                </div> : null}
            </>
        )
    }

    checkedBall = (id, e) => {
        e.preventDefault();
        e.stopPropagation();
        this.setState({
            checkedBall: id,
            relatedBall: chainMap[id] || []
        })
    }

    step0 = () => {
        return (
        <div className={`${styles.ballBox}`} onClick={(e) => this.checkedBall('', e)}>
            <div>
                <div className={`container`}>
                    <div className={styles.nebula1}></div>
                    <div className={styles.nebula2}></div>
                    {this.renderBall('ethereum', 1)}
                    {this.renderBall('crab', 2)}
                    {this.renderBall('darwinia', 3)}
                    {this.renderBall('tron', 4)}
                    {this.renderBall('polkadot', 5)}
                    {this.renderBall('kusama', 6)}
                    {this.renderBall('acala', 7)}

                    {this.renderSubBall(1)}
                    {this.renderSubBall(2)}
                    {this.renderSubBall(3)}
                    {this.renderSubBall(4)}
                    <div className={styles.subBall5Box}>
                        {this.renderSubBall(5)}
                    </div>
                    <p className={styles.powerLine}>Powered By Darwinia</p>
                </div>
            </div>
        
        </div>
        )
    }

    step1 = () => {
        const { t } = this.props
        const { networkType } = this.state
        return (
            <div>
                {this.renderHeader()}
                <div className={styles.formBox}>
                    <div className={`${styles.networkBox} claims-network-box`}>
                        <Form.Group controlId="networkSelectGroup">
                            <Form.Label>{t('crosschain:Select Chain')}</Form.Label>
                            <Form.Control as="select" value={networkType}
                                onChange={(value) => this.setValue('networkType', value)}>
                                <option value="eth">Ethereum -> Darwinia MainNet</option>
                                <option value="tron">Tron -> Darwinia MainNet</option>
                            </Form.Control>
                        </Form.Group>
                        <div className={styles.buttonBox}>
                            <Button variant="gray" onClick={this.toResult}>{t('crosschain:search')}</Button>
                            <Button variant="gray" onClick={() => this.toClaims(2)}>{t('crosschain:claim')}</Button>
                        </div>
                    </div>
                </div>
                <div className={styles.formBox}>
                    <div className={styles.stepRoadMap}>
                        <h3>{t('跨链转账路线图：')}</h3>
                        <div className={styles.stepRoadMapItem}>
                            <div>
                                <p>阶段1: 创世跨链</p>
                                <p>2020.05.30 - 2020.06.30</p>
                            </div>
                            <p>此阶段的跨链转账，将在 Darwinia 主网上线后到账，通过 Genesis Block 发至指定账号</p>
                        </div>
                        <div className={styles.stepRoadMapItem}>
                            <div>
                                <p>阶段2: 单向跨链</p>
                                <p>2020 Q3</p>
                            </div>
                            <p>此阶段的跨链转账，立即到账（可能存在一定的网络延迟），但仅支持发至Darwinia 主网的单项转账</p>
                        </div>
                        <div className={styles.stepRoadMapItem}>
                            <div>
                                <p>阶段3: 多向跨链</p>
                                <p>2020 Q3 - Q4</p>
                            </div>
                            <p>此阶段的跨链转账，立即到账（可能存在一定的网络延迟），且支持双向或多向转账</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    step2 = () => {
        const { t } = this.props
        const { networkType, account, status, signature, darwiniaAddress, ringBalance, ktonBalance, tokenType, crossChainBalance } = this.state
        return (
            <div>
                {this.renderHeader()}
                <div className={styles.formBox}>
                    <div className={`${styles.connectInfoBox} claims-network-box`}>
                        <h1><img alt="" src={labelTitleLogo} /><span>{t('crosschain:Connected to')}：</span></h1>
                        <p>{account[networkType]}</p>

                        {status === 3 ? <>
                            <h1><img alt="" src={labelTitleLogo} /><span>{t('crosschain:Darwinia Crab Network account')}：</span></h1>
                            <p>{darwiniaAddress}</p>
                        </> : null}
                    </div>
                </div>

                {status === 2 ? <div className={styles.formBox}>
                    <div className={`${styles.networkBox} claims-network-box`}>
                        <Form.Group controlId="darwinaAddressGroup">
                            <Form.Label>{t('crosschain:Please enter the account of Darwinia Crab')} <a href={this.renderHelpUrl()} target="_blank"
                                rel="noopener noreferrer"><img alt=""
                                    className={styles.labelIcon} src={helpLogo} /></a> </Form.Label>
                            <Form.Control type="text" placeholder={t('crosschain:Darwinia Crab Network account')} value={darwiniaAddress}
                                onChange={(value) => this.setValue('darwiniaAddress', value)} />
                            <Form.Text className="text-muted">
                                请务必填写真实的 Darwinia 主网账号，并妥善保管助记词等账号恢复文件。
                            </Form.Text>

                            <Form.Label>映射通证</Form.Label>
                            <Form.Control as="select" value={tokenType}
                                onChange={(value) => this.setValue('tokenType', value)}>
                                <option value="ring">RING(MAX {formatBalance(ringBalance, 'ether')})</option>
                                <option value="kton">KTON(MAX {formatBalance(ktonBalance, 'ether')})</option>
                            </Form.Control>

                            <Form.Label>映射数量</Form.Label>
                            <Form.Control type="number" placeholder={t('crosschain:Darwinia Crab Network account')} value={formatBalance(crossChainBalance, 'ether') === '0' ? '' : formatBalance(crossChainBalance, 'ether')} 
                                onChange={(value) => this.setValue('crossChainBalance', value, this.toWeiBNMiddleware)} />
                        </Form.Group>
                        <div className={styles.buttonBox}>
                            <Button variant="gray" onClick={this.buildInGenesis}>{t('crosschain:Submit')}</Button>
                            <Button variant="outline-gray" onClick={() => this.goBack(1)}>{t('crosschain:Back')}</Button>
                        </div>
                    </div>
                </div> : null}

                {status === 3 ? <div className={styles.formBox}>
                    <div className={`${styles.networkBox} ${styles.signatureBox} claims-network-box`}>
                        <Form.Group controlId="signatureGroup">
                            <Form.Label>{t('crosschain:Success! Please copy the signature below, and [claim] in Darwinia Wallet')}</Form.Label>
                            <Form.Control as="textarea" value={JSON.stringify(JSON.parse(signature), undefined, 4)}
                                rows="3" />
                        </Form.Group>
                        <div className={styles.buttonBox}>
                            <CopyToClipboard text={JSON.stringify(JSON.parse(signature), undefined, 4)}
                                onCopy={() => this.onCopied()}>
                                <Button variant="gray">{t('crosschain:Copy signature')}</Button>
                            </CopyToClipboard>
                            <Button variant="outline-gray" onClick={() => this.goBack(1)}>{t('crosschain:Back')}</Button>
                        </div>
                    </div>
                </div> : null}
            </div>
        )
    }

    step4 = () => {
        const { t } = this.props
        const { networkType, account, airdropNumber, claimTarget, claimAmount, hasFetched } = this.state
        return (
            <div>
                {this.renderHeader()}
                <div className={styles.formBox}>
                    <div className={`${styles.connectInfoBox} claims-network-box`}>
                        <h1><img alt="" src={labelTitleLogo} /><span>{t('crosschain:Connected to')}：</span></h1>
                        <p>{account[networkType]}</p>

                        <h1><img alt="" src={labelTitleLogo} /><span>{t('crosschain:Snapshot data')}：</span></h1>
                        <p>{claimAmount.eqn(0) ? formatBalance(airdropNumber) : formatBalance(claimAmount)} RING<br />({dayjs.unix(config.SNAPSHOT_TIMESTAMP).format('YYYY-MM-DD HH:mm:ss ZZ')})</p>

                        <h1><img alt="" src={labelTitleLogo} /><span>{t('crosschain:Destination')}：</span></h1>
                        <p>{claimTarget || '----'}</p>

                        <h1><img alt="" src={labelTitleLogo} /><span>{t('crosschain:Claims Result')}：</span></h1>
                        <p>{hasFetched ? (claimTarget ? t('crosschain:Claims') : t('crosschain:Not claimed')) : '----'}</p>
                        <div className={styles.buttonBox}>
                            <Button variant="outline-gray" onClick={() => this.goBack(1)}>{t('crosschain:Back')}</Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    isBallActive = (id) => {
        const { relatedBall, checkedBall } = this.state;
        if (!checkedBall || checkedBall === id) {
            return [true, checkedBall === id ? 1 : 0]
        }
        const isRelatedBall = relatedBall.includes(id)
        return [isRelatedBall, isRelatedBall ? 2 : -1]
    }


    fn_airdrop = () => {
        this.setState({
            status: 1,
            renderPage: 'airdrop'
        })
    }

    fn_crosschain = () => {
        this.setState({
            status: 1,
            renderPage: 'crosschain'
        })
    }

    fn_wrapper = (e, fnname, from, to) => {
        e.stopPropagation()
        this[`fn_${fnname}`] && this[`fn_${fnname}`]()
        this.setState({
            from, to
        })
    }

    renderContent = () => {
        const {renderPage} = this.state;
        return (<>
            {renderPage === 'crosschain' ? <CrossChain/> : null}
            {renderPage === 'airdrop' ? <Claim/> : null}
        </>)
    }

    hoverBtnAnime = () => {

    }

    renderBall = (id, styleId) => {
        const { checkedBall } = this.state
        const isBallActive = this.isBallActive(id)
        const isDisableBallClass = isBallActive[0] ? '' : styles.disableBall
        const isDisableBallShadowClass = isBallActive[0] ? '' : styles.disableBallShadow
        return (
            <>
                <div className={styles.scaleBox}>
                    <div className={`${styles['ball' + styleId]} ${isDisableBallClass}`} onClick={(e) => this.checkedBall(id, e)}>
                        <img className={styles.ballIcon} src={chainIcons[id]} alt="chain logo" />
                        <p>{id}</p>
                    </div>
                    <div className={`animeBg ${styles[`ball${styleId}Shadow`]}  ${isDisableBallShadowClass}`}></div>
                </div>
                {isBallActive[1] === 2 && chainMap[`${checkedBall}_${id}`] && chainMap[`${checkedBall}_${id}`].length ?
                    chainMap[`${checkedBall}_${id}`].map((item) => {
                        return <div className={`${styles[`ball${styleId}Btn`]}`} onClick={(e) => this.fn_wrapper(e, item, checkedBall, id)}>{item}</div>
                    })
                    : ''}
                {isBallActive[1] === 1 && !(chainMap[`${checkedBall}_${id}`] && chainMap[`${checkedBall}_${id}`].length) && (!chainMap[checkedBall] || !chainMap[checkedBall].length)?
                    <div className={`${styles[`ball${styleId}Btn`]} ${styles.disableBtn}`}>敬请期待</div>
                    : ''}
            </>
        )
    }

    renderSubBall = (styleId) => {
        const { checkedBall } = this.state
        // const isBallActive = this.isBallActive(id)
        const isBallActive = [true]
        const isDisableBallClass = isBallActive[0] ? '' : styles.disableBall
        return (
            <>
                <div className={styles.scaleBox}>
                    <div className={`${styles['subBall' + styleId]} ${isDisableBallClass}`}>
                    </div>
                </div>
            </>
        )
    }

    renderHelpUrl = () => {
        const lng = i18n.language.indexOf('en') > -1 ? 'en' : 'zh-CN'
        return `https://docs.darwinia.network/docs/${lng}/crab-tut-claim-cring`
    }

    renderGuide = (from, to) => {
        const fromStyleId = 'From';
        const toStyleId = 'To';
        const isDisableBallClass = '', isDisableBallShadowClass = '';

        return (<div>
            <div className={`${styles['ball' + fromStyleId]} ${isDisableBallClass}`}>
                <img className={styles.ballIcon} src={chainIcons[from]} alt="chain logo" />
                <p>{from}</p>
            </div>
            <div className={`${styles[`ball${fromStyleId}Shadow`]} ${isDisableBallShadowClass}`}></div>
            <div className={`${styles['ball' + toStyleId]} ${isDisableBallClass}`}>
                <img className={styles.ballIcon} src={chainIcons[to]} alt="chain logo" />
                <p>{to}</p>
            </div>
            <div className={`${styles[`ball${toStyleId}Shadow`]} ${isDisableBallShadowClass}`}></div>
        </div>)
    }

    render() {
        const { t } = this.props
        const { status, from, to } = this.state
        return (
            <div className={styles.wrapperBox}>
                <div className={`${styles.header}`}>
                    <div className={`container ${styles.headerInner}`}>
                        <div>
                            <a href="/">
                                <img alt="darwina network logo" src={darwiniaLogo} />
                                <span>{t('crosschain:title')}</span>
                            </a>
                        </div>
                        <div>
                            <a href="javascript:void(0)" onClick={this.changeLng} className={styles.changeLng}>
                                {i18n.language.indexOf('en') > -1 ? '中文' : 'EN'}
                            </a>
                        </div>
                    </div>
                </div>
                {status === 0 ? this.step0() : null}
                {status !== 0 ? <div className={`${styles.claim}`}>
                    <Container>
                        <div className={styles.claimBox}>
                            {/* {status === 1 ? this.step1() : null} */}
                            {status === 1 ? this.renderContent() : null}
                            {/* {status === 2 || status === 3 ? this.step2() : null}
                            {status === 4 ? this.step4() : null} */}
                            <div className={styles.powerBy}>
                                Powered By Darwinia Network
                            </div>
                        </div>
                        <div className={styles.guideBox}>
                            {this.renderGuide(from, to)}
                            {/* <div> */}
                            {/* {i18n.language.indexOf('en') > -1 ? <img alt="" className={styles.promoteLogo} src={promoteLogoEn} /> : <img alt="" className={styles.promoteLogo} src={promoteLogo} />}
                                <Button variant="color" target="_blank" href={t('crosschain:darwinaPage')}>{t('crosschain:About Darwinia Crab')}</Button> */}
                            {/* <a href="javascript:void(0)" onClick={this.changeLng} className={`${styles.changeLng} ${styles.changeLngMobil}`}>
                                    {i18n.language.indexOf('en') > -1 ? '中文' : 'EN'}
                                </a> */}
                            {/* </div> */}
                        </div>
                        <div className={styles.infoBox}>
                            <div>
                                <img alt="" className={styles.promoteLogo} src={promoteLogo} />
                                <Button variant="color" target="_blank" href={t('page:darwinaPage')}>{t('page:About Darwinia Crab')}</Button>
                                <a href="javascript:void(0)" onClick={this.changeLng} className={`${styles.changeLng} ${styles.changeLngMobil}`}>
                                    {i18n.language.indexOf('en') > -1 ? '中文' : 'EN' }
                                </a>
                            </div>
                        </div>
                    </Container>
                </div> : null}
                <ToastContainer autoClose={2000} />
            </div>
        );
    }
}

export default withTranslation()(Claims);
