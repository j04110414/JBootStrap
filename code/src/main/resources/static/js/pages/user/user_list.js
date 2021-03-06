jbootstrap.userList = (function (jbootstrap, window, $) {


    //dataTables 对象
    var table;

    //所有角色数组
    var allRoles;

    var readyFunc = function () {

        initTableData();

        initPageOperate();

        //initCheckAll();
    };


    /**
     * 初始化table数据
     */
    function initTableData() {

        table = $('#tab-userlist').DataTable({
            ajax: {
                //指定数据源
                url: baseContextPath + "users/pagerData",
                dataSrc: "data",
                data: function (d) {
                    var param = {};
                    param.draw = d.draw;
                    param.start = d.start;
                    param.length = d.length;

                    var formData = $("#queryForm").serializeArray();//把form里面的数据序列化成数组
                    formData.forEach(function (e) {
                        param[e.name] = e.value;
                    });
                    return param;//自定义需要传递的参数。
                },
            },
            fnDrawCallback: function () {
                var api = this.api();
                var startIndex = api.context[0]._iDisplayStart;//获取到本页开始的条数
                api.column(1).nodes().each(function (cell, i) {
                    cell.innerHTML = startIndex + i + 1;
                });
            },
            columns: [
                {
                    "data": "id"
                }, {
                    "data": null //此列不绑定数据源，用来显示序号
                }, {
                    "data": "photo",
                    "render": function (data, type, row, meta) {

                        var img = row.photo;
                        if (!img) {
                            img = baseContextPath + "/" + "img/user2-160x160.jpg";
                        }
                        //渲染 把数据源中的标题和url组成超链接
                        return '<img width="20" onerror="jbootstrap.userList.imgOnerror(this)" src="' + img + '">';
                    }
                }, {
                    "data": "username"
                }, {
                    "data": "no"
                }, {
                    "data": "name"
                }, {
                    "data": "email"
                }, {
                    "data": "phone"
                }, {
                    "data": "mobile"
                }, {
                    "data": null,
                    "render": function (data, type, row, meta) {

                        var source = $("#tpl").html();
                        var template = Handlebars.compile(source);

                        var context = {id: row.id,username:row.username, editUrl: baseContextPath + "users/form?id=" + row.id};
                        var html = template(context);

                        return html;
                    }
                }],
            columnDefs: [
                {
                    "visible": false,
                    "targets": 0
                }
                /*, {
                    "visible": false,
                    "targets": 1
                    "defaultContent": "<input type='checkbox' name='checkList'>"
                }*/
                ]

        });


    }

    /**
     * 初始化页面操作
     */
    function initPageOperate() {

        //查询按钮
        $("#btn-query").on("click", function () {
            table.draw();
        });

        //刷新
        $("#btn-re").on("click", function () {
            table.draw(false);//刷新保持分页状态
        });
    }


    /**
     * 设置全选
     */
    function initCheckAll() {

        table.on("change", ":checkbox", function () {

            if ($(this).is("#checkAll")) {
                //全选
                $("#tab-userlist_wrapper :checkbox[name=checkList]").prop("checked", $(this).prop("checked"));
            } else {
                //一般复选
                var checkbox = $("#tab-userlist_wrapper :checkbox[name=checkList]");
                $("#tab-userlist_wrapper #checkAll").prop('checked', checkbox.length == checkbox.filter(':checked').length);
            }
        })

    }

    /**
     * 设置默认头像
     * @param img
     */
    var imgOnerrorFunc = function (img) {
        img.src = baseContextPath + "/" + "img/user2-160x160.jpg";
        img.onerror = null;//控制不要一直跳动
    }


    /**
     * 删除
     * @param id
     */
    var delRowFunc = function (id) {


        swal({
            title: "您确定要删除该条数据吗？",
            type: "warning",
            showCancelButton: true,
            confirmButtonText: "确定",
            cancelButtonText:"取消",
            closeOnConfirm: false
        }, function () {

            $.ajax({
                url: baseContextPath + 'users/del/' + id,
                type: 'get',
                success: function (msg) {
                    if (msg.code === "6000") {

                        swal({
                            title: "删除成功！",
                            type: "success",
                            timer: 1000,
                            showConfirmButton: false
                        });

                        table.draw();

                    } else {
                        swal({
                            title: "删除失败！",
                            type: "error",
                            timer: 2000,
                            showConfirmButton: false
                        });
                    }
                },
                error:function () {
                    showAjaxErrorMsg();
                }
            });
        });


    }



    /**
     * 弹出指定角色模态框
     * @param id
     * @param description
     */
    var assignRolesModalFunc = function (id, description) {

        //设置当前修改用户的ID
        $("#currUserId").val(id);

        //设置标题
        $("#assignRolesModal .modal-title").html("分配角色：" + description);

        //角色数据为空，则初始化
        if(!allRoles){
            initAllRoles();
        }

        //取消选中
        $('#assignRolesModal input:checkbox').iCheck('uncheck');

        //获取当前用户拥有的角色
        var roles = [];
        $.ajax({
            async: false,
            url: baseContextPath + "users/roleIds",
            dataType: 'json',
            data: {
                userId: id
            },
            success: function (data) {

                roles = data;
            }
        });

        //设置选中项
        $('#assignRolesModal input:checkbox').each(function () {

            //当前节点ID包含在roles中，则设置选中
            if ($.inArray($(this).val(), roles) > -1) {

                $(this).iCheck("check");
            }
        })


        $('#assignRolesModal').modal('toggle');
    }


    /**
     * 获取所有角色并填充模板
     */
    function initAllRoles(){

        //获取所有角色
        $.ajax({
            async: false,
            url: baseContextPath + "roles/listData",
            dataType: 'json',
            data: {
            },
            success: function (data) {
                allRoles = data;
            }
        });


        //填充所有角色的模板
         var template = Handlebars.compile($("#tpl-allRoles").html());
         $('#allRolesForm').append(template(allRoles));


         //设定icheck选择
        $('#assignRolesModal input').iCheck({
            checkboxClass: 'icheckbox_square-blue',
            radioClass: 'iradio_square-blue'
        });

    }
    
    
    var assignRolesSaveFunc = function() {

        var userId = $("#currUserId").val();

        $.ajax({
            type: "POST",
            url: baseContextPath + "users/saveAssignRoles",
            data:$("#allRolesForm").serialize(),
            async: false,
            success: function(data) {

                if (data.code === "6000") {

                    $('#assignRolesModal').modal('toggle');

                    swal({
                        title: "保存成功！",
                        type: "success",
                        timer: 2000,
                        showConfirmButton: false
                    });

                } else {
                    swal({
                        title: "保存失败！",
                        type: "error",
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
            },
            error: function(request) {
                showAjaxErrorMsg();
            }
        });
    }

    return {
        ready: readyFunc,
        imgOnerror: imgOnerrorFunc,
        assignRolesModal: assignRolesModalFunc,
        delRow: delRowFunc,
        assignRolesSave:assignRolesSaveFunc,
    };
})(jbootstrap, window, jQuery);

jbootstrap.userList.ready();