package com.dmm.module.controller;

import com.dmm.common.constants.GlobalConstant;
import com.dmm.module.domain.User;
import com.dmm.module.service.UserService;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.*;
import org.apache.shiro.authz.annotation.RequiresAuthentication;
import org.apache.shiro.crypto.hash.SimpleHash;
import org.apache.shiro.session.Session;
import org.apache.shiro.subject.Subject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Created by cremin on 2017/7/31.
 */
@Controller
public class LoginController {


    private static final Logger LOGGER = LoggerFactory.getLogger(LoginController.class);

    @Autowired
    UserService userService;


    @RequestMapping(value = "/login", method = RequestMethod.GET)
    public String welcome(Model model) {
        return "login";
    }

    @RequestMapping(value = "/login", method = RequestMethod.POST)
    public String login(@RequestParam("username") String username, @RequestParam("password") String password, Model model) {


        UsernamePasswordToken token = new UsernamePasswordToken(username, password);

        //获取当前的Subject
        Subject currentUser = SecurityUtils.getSubject();

        if (currentUser.isAuthenticated() || currentUser.isRemembered()) {
            return "redirect:/";
        }


        try {
            //在调用了login方法后,SecurityManager会收到AuthenticationToken,并将其发送给已配置的Realm执行必须的认证检查
            //每个Realm都能在必要时对提交的AuthenticationTokens作出反应
            //所以这一步在调用login(token)方法时,它会走到MyRealm.doGetAuthenticationInfo()方法中,具体验证方式详见此方法
            currentUser.login(token);

        } catch (UnknownAccountException uae) {
            model.addAttribute("message", "未知账户");
        } catch (IncorrectCredentialsException ice) {
            model.addAttribute("message", "密码不正确");
        } catch (LockedAccountException lae) {
            model.addAttribute("message", "账户已锁定");
        } catch (ExcessiveAttemptsException eae) {
            model.addAttribute("message", "用户名或密码错误次数过多");
        } catch (AuthenticationException ae) {
            model.addAttribute("message", "用户名或密码不正确");
        }
        //验证是否登录成功
        if (currentUser.isAuthenticated()) {

            Session session = currentUser.getSession();
            User user = userService.selectByUserName(username);
            session.setAttribute(GlobalConstant.CURR_USER_SESSION_KEY, user);

            return "redirect:/";
        } else {
            token.clear();
            return "login";
        }
    }


    @RequiresAuthentication
    @RequestMapping(value = "/")
    public String index(Model model) {
        return "index";
    }

    /**
     * 退出
     *
     * @return
     */
    @RequestMapping(value = "/logout", method = RequestMethod.GET)
    @ResponseBody
    public Map<String, Object> logout() {
        Map<String, Object> resultMap = new LinkedHashMap<String, Object>();
        Subject subject = SecurityUtils.getSubject();
        subject.getSession().setAttribute(GlobalConstant.CURR_USER_SESSION_KEY, null);

        subject.logout();
        return resultMap;
    }


    /**
     * 根据用户名和明文密码获取加密后的值
     *
     * @return
     */
    @RequiresAuthentication
    @RequestMapping(value = "/encryption/{username}/{password}", method = RequestMethod.GET)
    @ResponseBody
    public String encryption(@PathVariable("username") String username, @PathVariable("password") String password) {
        return new SimpleHash("MD5", password, username, 2).toString();
    }

}
