# 第 1 章 Java 基础：语法、面向对象、泛型、异常、IO

> 一句话定位：所有后续模块的地基。这一章答不好，后面答得再花也会被判定为"只会用框架"。

## 一、本章考察重点概览

Java 基础在面试中的角色不是"筛知识点"，而是校准你的**语言功底可信度**。面试官通过这一章判断三件事：你是否理解 Java 的对象模型与内存语义；你写的代码是否有边界意识（空值、异常、资源释放、并发可见性）；你能不能把一个"背下来的结论"讲到实现层。

具体到考点，有四个特征值得注意：

1. **看似简单的题最容易翻车。** `String s = new String("a")` 创建几个对象、`finally` 里 `return` 会怎样、`==` 与 `equals` 的区别，这类题答错一次，后面所有"深度"都会被折价。
2. **泛型与反射是分水岭。** 初级能说出"泛型会擦除"，中级能讲清擦除带来的桥方法、为什么不能 `new T[]`，高级能联系到 Spring 的类型推断、JSON 反序列化的 `TypeReference`。
3. **异常与 IO 考的是工程习惯。** 是否用 try-with-resources、是否吞异常、是否用异常做流程控制，这些直接映射到代码 review 的观感。
4. **IO 模型是通往 Netty、Redis、Kafka 的入口。** 这一章讲不清 BIO/NIO/多路复用，后面消息队列和 RPC 的"高性能"就只能复述结论。

| 考点 | 出现频率 | 难度 | 说明 |
| --- | --- | --- | --- |
| String 与常量池 | 高 | 初级 | 几乎每场必问，常作为开场破冰题 |
| equals / hashCode 契约 | 高 | 初级 | 常与 HashMap 联合考察 |
| 面向对象三大特性与多态实现 | 高 | 初级 | 常要求结合 JVM 方法调用说明 |
| 泛型擦除与通配符 | 中 | 中级 | 中高级岗位区分度较高 |
| 异常体系与 try-with-resources | 中 | 初级 | 偏工程规范，常结合代码题 |
| 反射与动态代理 | 高 | 中级 | Spring、RPC、ORM 的共同底座 |
| BIO / NIO / 多路复用 / 零拷贝 | 高 | 中级 | 高级岗位会追问 epoll 与 Netty |
| 序列化与深浅拷贝 | 中 | 中级 | 分布式场景下的隐性坑 |

## 二、复习优先级

| 优先级 | 题目编号 | 理由 |
| --- | --- | --- |
| P0 | Q1、Q2、Q3、Q4、Q10、Q13、Q16 | 开场题与高频题，必须做到"一句话结论 + 三层展开"不卡壳 |
| P1 | Q5、Q6、Q7、Q8、Q11、Q12、Q14、Q15 | 决定你是"中级"还是"只会写业务" |
| P2 | Q9、Q17、Q18 | 加分项，时间紧时只需记住结论与一个例子 |

时间分配建议：本章 2 天。P0 占 60% 时间，要求能对着白板画出对象内存布局、异常表结构、IO 模型对比图；P1 占 30%，重点是把"为什么"讲顺；P2 剩 10%，面试前一天扫一遍即可。

## 三、高频面试题清单

| 编号 | 题目 | 面试难度 | 阅读门槛 | 优先级 | 一句话答案 |
| --- | --- | --- | --- | --- | --- |
| Q1 | `String` 为什么设计成不可变？常量池与 `intern()` 是怎么回事？ | 初级 | 中 | P0 | 不可变换来线程安全、hash 可缓存与常量池复用；`intern` 把堆内字符串登记进串池 |
| Q2 | `==`、`equals`、`hashCode` 三者的关系是什么？ | 初级 | 低 | P0 | `==` 比值/引用，`equals` 比语义，`hashCode` 必须与 `equals` 保持一致 |
| Q3 | 重载与重写的区别？多态在 JVM 层怎么实现？ | 初级 | 中 | P0 | 重载编译期静态分派，重写运行期动态分派，靠 vtable/itable 查表 |
| Q4 | 接口与抽象类怎么选？ | 初级 | 低 | P0 | 抽象类表达"是什么"并承载状态，接口表达"能做什么"且可多实现 |
| Q5 | 泛型擦除是什么？为什么不能 `new T[]`、不能对泛型做 `instanceof`？ | 中级 | 中 | P1 | 擦除后类型参数变上界，运行期无泛型信息，故无法构造与判定 |
| Q6 | 通配符 `? extends T` 与 `? super T` 怎么选？ | 中级 | 高 | P1 | 生产者用 extends，消费者用 super，即 PECS 原则 |
| Q7 | 异常体系怎么分层？checked 与 unchecked 该怎么选？ | 初级 | 低 | P1 | checked 强制处理可恢复的外部故障，unchecked 表示编程错误 |
| Q8 | `try`/`catch`/`finally` 中 `return` 的执行顺序？finally 会改变返回值吗？ | 中级 | 中 | P1 | finally 一定执行，但返回值在 finally 前已入栈，改局部变量不影响结果 |
| Q9 | try-with-resources 的原理？为什么它比手写 finally 更好？ | 中级 | 低 | P2 | 编译器生成 `addSuppressed` 的关闭逻辑，异常不丢、顺序可控 |
| Q10 | 反射的原理与代价？动态代理有哪两种实现？ | 中级 | 中 | P0 | 运行时解析 Class 元数据；JDK 代理靠接口，CGLIB 靠继承生成子类 |
| Q11 | 深拷贝与浅拷贝的区别？怎么实现深拷贝？ | 中级 | 低 | P1 | 浅拷贝共享引用对象，深拷贝递归复制；序列化最稳但有性能成本 |
| Q12 | `static`、`final`、初始化顺序，类的加载与初始化何时触发？ | 中级 | 中 | P1 | 静态属于类、只初始化一次；父类静态 → 子类静态 → 父类实例 → 子类实例 |
| Q13 | BIO、NIO、AIO 的区别？多路复用解决了什么问题？ | 中级 | 中 | P0 | BIO 一连接一线程，NIO 事件驱动单线程管多连接，AIO 由内核完成回调 |
| Q14 | select / poll / epoll 的差异？水平触发与边缘触发？ | 高级 | 高 | P1 | epoll 用红黑树注册 + 就绪链表回调，避免 O(n) 全量扫描 |
| Q15 | 零拷贝是什么？`mmap` 与 `sendfile` 分别省了什么？ | 高级 | 高 | P1 | 减少用户态/内核态拷贝与上下文切换，Kafka、Netty 的核心优化之一 |
| Q16 | `final`、`finally`、`finalize` 有什么区别？ | 初级 | 低 | P0 | 修饰符 / 必执行代码块 / 已废弃的回收前回调 |
| Q17 | 什么是 SPI？JDK 的 SPI 与 Dubbo 的 SPI 差在哪？ | 高级 | 高 | P2 | 接口与实现分离由配置加载；Dubbo 增加了键值加载、IOC 与包装 |
| Q18 | Java 是值传递还是引用传递？ | 初级 | 低 | P2 | 只有值传递，引用类型传的是引用的副本 |

## 四、题目详解

### Q1. `String` 为什么设计成不可变？常量池与 `intern()` 是怎么回事？（初级）

> 前置：堆与栈、字符串常量池、`final` 语义

**一句话结论**：`String` 用 `final char[]`（JDK 9 起为 `byte[]` + `coder`）保存内容且不暴露修改入口，从而获得线程安全、hash 可缓存、常量池可复用三大收益；`intern()` 的作用是把堆上的字符串登记到字符串常量池并返回池中引用。

**先把话说白**：字符串是 Java 里使用频率最高的对象。如果它可变，那么"两个字面量相同的字符串共用一份内存"就不成立，因为任何一处修改都会污染其他使用者。JDK 选择让 String 一旦创建就不能改，换来的是可以放心共享——共享的前提正是不可变。

**底层原理**：

1. **不可变是怎么做到的。** `String` 类本身是 `final` 的，避免子类改写行为；内部字符存储是 `private final` 的数组，且没有任何修改数组元素的方法。所有"看起来会修改"的方法（`substring`、`concat`、`replace`、`toUpperCase`）都返回新对象。JDK 9 为了节省内存把 `char[]` 改成 `byte[]` 加一个 `coder` 编码标记，Latin-1 字符只占 1 字节，这是紧凑字符串（Compact Strings）优化，不改变不可变语义。

2. **三大收益的因果链。**
   - 线程安全：状态不可变，天然可被多线程共享，无需同步。
   - hash 可缓存：`hashCode` 只算一次并存入 `hash` 字段，使 String 成为 HashMap 的理想 key。
   - 常量池可复用：字面量在类加载时进入字符串常量池，相同字面量指向同一对象，比较与存储都更省。

3. **常量池的位置变迁。** JDK 6 及以前字符串常量池在永久代（PermGen）；JDK 7 移到堆中；JDK 8 用元空间（Metaspace）替代永久代，但字符串常量池仍在堆里。这个变迁的意义是：常量池中的字符串也能被 GC 回收，降低了 `OutOfMemoryError: PermGen space` 的风险。

4. **`intern()` 到底做了什么。** 调用 `s.intern()` 时，若常量池中已存在 equals 相等的字符串，返回池中那个引用；否则把当前字符串的引用登记进池并返回。JDK 7 之后登记的是**堆中对象的引用**，而不是复制一份到池里，因此 `intern()` 在大量重复字符串场景下能显著降内存，但池本身也会膨胀。

```java
String a = "java";              // 常量池
String b = new String("java");  // 堆对象，构造时字面量已在池中
System.out.println(a == b);          // false
System.out.println(a == b.intern()); // true
```

5. **代价与边界。** 频繁拼接会产生大量中间对象，循环内拼接必须用 `StringBuilder`；`StringBuilder` 非线程安全，多线程共享才需要 `StringBuffer`。另外 `intern()` 不适合高基数、低重复的数据，会把常量池打爆。

**易混对比**：

| 表达式 | 对象数量 | 说明 |
| --- | --- | --- |
| `String s = "a"` | 0 或 1 | 池中已有则复用，不新建 |
| `new String("a")` | 1（堆）+ 池中复用 | 字面量先入池，再在堆中复制 |
| `"a" + "b"` | 1 | 编译期常量折叠为 `"ab"` |
| `a + b`（变量） | 3 | JDK 9 前编译为 StringBuilder 拼接 |

**面试追问**：
- 追问：`String s = new String("abc")` 创建几个对象？→ 答题要点：分情况，池中没有则是 2 个（池中字面量 + 堆对象），已有则 1 个；回答时要先声明前提。
- 追问：为什么 `char[]` 换成 `byte[]`？→ 答题要点：紧凑字符串，Latin-1 省一半内存，`coder` 区分编码，读操作按编码分支。
- 追问：`String` 真的完全不可变吗？→ 答题要点：反射可以改私有 final 字段的值（JDK 17 起受模块系统限制更强），但这是破坏封装的行为，不属于正常语义。

### Q2. `==`、`equals`、`hashCode` 三者的关系是什么？（初级）

> 前置：引用与对象、散列表定位、包装类缓存

**一句话结论**：`==` 比较基本类型的值或引用地址；`equals` 是业务语义相等；`hashCode` 是散列值，必须满足"equals 相等则 hashCode 必相等"的契约，反之不成立。

**先把话说白**：`==` 回答的是"是不是同一个东西"，`equals` 回答的是"是不是一样的东西"。散列表（HashMap、HashSet）为了快速定位，先用 `hashCode` 找到桶，再用 `equals` 在桶内确认，所以两者必须配套，否则会"存进去却取不出来"。

**底层原理**：

1. **`==` 的语义由类型决定。** 八种基本类型比较值；引用类型比较是否指向同一对象。注意包装类型与基本类型混合比较时会自动拆箱，`Integer` 与 `int` 比较走的是数值比较。

2. **`Object.equals` 的默认实现就是 `==`。** 源码是 `return (this == obj);`。所以不重写 `equals` 的类，语义上等价于身份比较。重写时必须满足五个性质：自反、对称、传递、一致、对 null 返回 false。

3. **`hashCode` 的契约。** 同一对象多次调用应返回相同值（前提是参与比较的字段没变）；`equals` 相等的两个对象 `hashCode` 必须相等；`equals` 不等的对象 `hashCode` 尽量不同（影响性能而非正确性）。

4. **不重写 `hashCode` 会发生什么。** 两个 `equals` 相等的对象 hash 不同，会被分到不同桶，HashMap 认为它们是两个 key，出现重复存储、`get` 取不到、`remove` 删不掉。反过来只重写 `hashCode` 不重写 `equals`，桶内比较仍走身份比较，同样出错。

5. **包装类的缓存陷阱。** `Integer.valueOf` 缓存 -128~127（上界可用 `-XX:AutoBoxCacheMax` 调整），此区间内 `==` 为 true，超出则为 false。`Long`、`Short`、`Byte` 同样有缓存，`Float`、`Double` 没有。

```java
Integer a = 127, b = 127;
System.out.println(a == b);   // true，命中缓存
Integer c = 128, d = 128;
System.out.println(c == d);   // false，超出缓存范围
System.out.println(c.equals(d)); // true
```

**易混对比**：

| 比较方式 | 比较对象 | 是否可重写 | 典型误用 |
| --- | --- | --- | --- |
| `==` | 值或引用 | 否 | 用 `==` 比较 String 内容 |
| `equals` | 语义内容 | 是 | 不重写 hashCode 就放进 HashMap |
| `hashCode` | 散列值 | 是 | 用可变字段参与计算，入表后改字段 |
| `compareTo` | 排序大小 | 是 | 与 equals 不一致导致 TreeMap 行为异常 |

**面试追问**：
- 追问：两个对象 `hashCode` 相同，`equals` 一定相同吗？→ 答题要点：不一定，叫哈希冲突，HashMap 用链表/红黑树解决。
- 追问：为什么重写 `equals` 必须重写 `hashCode`？→ 答题要点：从散列表的定位流程解释，先 hash 后 equals。
- 追问：用可变对象作 HashMap 的 key 有什么问题？→ 答题要点：修改参与 hash 计算的字段后，桶位置变了，原 entry 再也找不到，等于内存泄漏。

### Q3. 重载与重写的区别？多态在 JVM 层怎么实现？（初级）

> 前置：方法签名、继承与多态、字节码指令

**一句话结论**：重载（Overload）是同一类中方法名相同、参数列表不同，属于编译期静态分派；重写（Override）是子类覆盖父类方法，属于运行期动态分派，JVM 通过虚方法表（vtable）按实际类型查表调用。

**先把话说白**：重载是"同名不同参"，编译器看**参数的静态类型**就决定了调哪个；重写是"子类改写父类行为"，编译器只知道你要调父类声明的方法，真正执行哪个版本要等运行时看对象的真实类型——这就是多态。

**底层原理**：

1. **重载的判定规则。** 方法签名 = 方法名 + 参数列表（类型、个数、顺序），与返回值、异常声明、访问修饰符无关。所以"仅返回值不同"无法构成重载，编译直接报错。

2. **静态分派的坑。** 重载版本在编译期按静态类型选定，且优先级为：精确匹配 → 自动类型提升（byte→short→int→long→float→double）→ 装箱/拆箱 → 可变参数。这意味着传入 `null` 时可能选中"更具体"的那个重载，也意味着 `f(int)` 与 `f(Integer)` 在传 `int` 时选前者。

3. **动态分派的实现。** 每个类在方法区（JDK 8 后为元空间）有一张虚方法表，表中存放该类各虚方法的实际入口地址。子类重写后，表中对应槽位被替换为子类实现。调用 `invokevirtual` 时，JVM 取对象头的类型指针找到类的 vtable，按方法槽位取出地址并跳转——这是一次间接寻址，成本接近一次数组访问。

4. **`invokevirtual` 与 `invokeinterface` 的差别。** 前者按固定偏移查 vtable，效率高；后者因为一个类可实现多个接口，偏移不固定，HotSpot 用 itable（接口方法表）加 inline cache 优化，稳定后可接近直接调用。

5. **哪些方法不参与动态分派。** `final`、`private`、`static` 方法以及构造器，编译期即可确定目标，分别用 `invokespecial`、`invokestatic` 调用。`private` 方法本质上不是"继承"，子类写同名方法只是新方法。

```java
class Parent { void say() { System.out.println("parent"); } }
class Child extends Parent { @Override void say() { System.out.println("child"); } }

Parent p = new Child();
p.say();                 // child，运行期按实际类型分派
```

**易混对比**：

| 维度 | 重载 Overload | 重写 Override |
| --- | --- | --- |
| 发生位置 | 同一个类（或父子类之间） | 父子类之间 |
| 判定依据 | 方法名 + 参数列表 | 方法名 + 参数列表 + 返回类型兼容 |
| 绑定时机 | 编译期 | 运行期 |
| JVM 指令 | `invokestatic` / `invokespecial` / `invokevirtual` 均可能 | `invokevirtual` / `invokeinterface` |
| 访问权限 | 无限制 | 不能比父类更严格 |

**面试追问**：
- 追问：重写能否缩小访问权限？→ 答题要点：不能，违反里氏替换；可以放大。
- 追问：重写能否抛出更宽的受检异常？→ 答题要点：不能，只能抛出父类方法声明异常的子类或不抛。
- 追问：`static` 方法能被重写吗？→ 答题要点：不能，叫隐藏（hide），按静态类型调用。

### Q4. 接口与抽象类怎么选？（初级）

> 前置：继承体系、接口默认方法

**一句话结论**：抽象类表达"is-a"的模板复用，可以有状态、构造器和具体实现；接口表达"can-do"的能力契约，支持多实现。设计上优先用接口定义契约，需要共享实现时再用抽象类。

**先把话说白**：抽象类是"半成品父类"，它知道子类大概长什么样，可以先把公共代码写好；接口是"能力证书"，它只规定你必须会什么，不关心你是谁的儿子。Java 单继承多实现，所以接口的扩展性更好；抽象类则更适合承载"骨架 + 可变步骤"。

**底层原理**：

1. **语言层面的差异。** 抽象类可有成员变量、构造器、普通方法、抽象方法，访问修饰符自由；接口的字段隐式为 `public static final`，方法在 JDK 8 前必须是 `public abstract`。

2. **JDK 8 之后的接口演进。** JDK 8 引入 `default` 方法与 `static` 方法，让接口可以在不破坏实现类的前提下新增方法（这也是给集合框架加 `stream()` 的原因）；JDK 9 又加了 `private` 方法供 default 方法复用。但接口仍然不能有实例字段和构造器。

3. **菱形冲突规则。** 一个类实现两个接口且都有同名 default 方法时，编译报错，必须在实现类中显式 `InterfaceA.super.method()` 指定。类优先原则：父类的方法优先于接口 default 方法。

4. **JVM 视角。** 抽象类与普通类一样是单继承体系，方法调用走 vtable；接口方法调用走 itable，且实现类可以在运行期被多个接口"贴上能力标签"，这是策略模式、SPI 的基础。

5. **选择的实际判据。** 需要维护状态或强制初始化流程（模板方法）→ 抽象类；需要跨不相关的类赋予同一能力（`Comparable`、`Serializable`）→ 接口；既要契约又要复用 → 接口 + 抽象骨架类（如 `AbstractList` 实现 `List`）。

**易混对比**：

| 维度 | 抽象类 | 接口 |
| --- | --- | --- |
| 继承数量 | 单继承 | 多实现 |
| 实例字段 | 可以 | 不可以（只能常量） |
| 构造器 | 有 | 无 |
| 方法实现 | 任意 | default / static / private（JDK 9+） |
| 设计语义 | is-a，模板复用 | can-do，能力契约 |
| 演进成本 | 加抽象方法会影响所有子类 | 加 default 方法可向后兼容 |

**面试追问**：
- 追问：接口能有构造器吗？→ 答题要点：不能，接口不被实例化，字段在准备阶段就赋默认值、初始化阶段赋常量值。
- 追问：JDK 8 为什么引入 default 方法？→ 答题要点：集合框架加 `stream()` 而不破坏第三方实现，本质是"接口演进"问题。
- 追问：什么时候抽象类优于接口？→ 答题要点：需要共享状态或固定算法骨架时，如 `AbstractQueuedSynchronizer`。

### Q5. 泛型擦除是什么？为什么不能 `new T[]`、不能对泛型做 `instanceof`？（中级）

> 前置：泛型语法、类型上界、反射

**一句话结论**：Java 泛型是编译期特性，编译后类型参数被擦除为上界（无界则为 `Object`），并在需要处插入强制转换，运行期不存在 `List<String>` 与 `List<Integer>` 的区别；因此无法在运行期获取真实类型参数，也就不能 `new T[]` 或 `instanceof T`。

**先把话说白**：泛型像是编译器给你贴的标签，编译完标签就撕掉了，字节码里只剩"装的是 Object"。编译器在读取的地方偷偷帮你加 `checkcast`，在写入的地方帮你检查类型。这样做的根本原因是**向后兼容**：JDK 5 引入泛型时，必须让老版本的类库和字节码继续能跑。

**底层原理**：

1. **擦除规则。** 无界类型参数擦成 `Object`；有界擦成第一个上界，如 `<T extends Comparable<T>>` 擦成 `Comparable`。泛型类的类型参数、泛型方法的类型参数都会被擦除，方法的返回类型若依赖类型参数也会被替换并插入转换。

2. **擦除后的产物。** `List<String>` 与 `List<Integer>` 的运行时类都是 `ArrayList.class`，`getClass()` 结果相同，所以 `list instanceof List<String>` 非法，只能写 `instanceof List`（且因擦除导致恒真，编译器通常直接拒绝）。

3. **桥方法（Bridge Method）。** 子类重写泛型父类方法时，由于擦除，父类方法签名是 `compareTo(Object)`，子类是 `compareTo(MyType)`，两者签名不同就无法构成重写。编译器会在子类生成一个桥方法 `compareTo(Object)`，内部转调 `compareTo(MyType)` 并做强转。这也是"为什么 `getDeclaredMethods()` 会多出一个方法"的原因。

4. **为什么不能 `new T[]`。** 数组是协变的且运行期保留元素类型（`String[]` 的 `getClass()` 是 `[Ljava.lang.String;`），而泛型擦除后 `T` 的真实类型不可知，JVM 无法为数组分配正确的元素类型并做 `ArrayStoreException` 检查。所以只能 `(T[]) new Object[n]` 这种非检查转换，或用 `Array.newInstance(clazz, n)` 配合 `Class<T>` 令牌。

5. **擦除带来的其他限制。** 不能有 `static` 泛型字段（静态属于类，类型参数属于实例化）；不能 `catch (T t)`；不能重载 `f(List<String>)` 与 `f(List<Integer>)`（擦除后签名相同）；基本类型不能作类型参数，必须用包装类。

```java
public class Box<T> {
    private T value;
    public <E> E[] makeArray(Class<E> type, int n) {
        return (E[]) Array.newInstance(type, n); // 用 Class 令牌绕过擦除
    }
}
```

**易混对比**：

| 特性 | 数组 | 泛型集合 |
| --- | --- | --- |
| 类型信息 | 运行期保留（可 `getClass`） | 编译期擦除 |
| 协变 | 协变，可能 `ArrayStoreException` | 不变，编译期拒绝 |
| 创建 | `new T[]` 不允许 | `new ArrayList<T>()` 允许（擦除后是 Object 容器） |
| 检查时机 | 运行期 | 编译期 |

**面试追问**：
- 追问：既然擦除了，Spring 怎么知道你要注入 `List<User>`？→ 答题要点：通过方法参数/字段的 `ParameterizedType` 元数据（反射可读到签名信息），不是运行期对象自带。
- 追问：`List<? extends Number>` 为什么不能 add？→ 答题要点：编译器只知道元素是 Number 的某个子类型，无法保证加入的类型匹配，只能读不能写。
- 追问：Gson 的 `TypeToken` 为什么用匿名子类？→ 答题要点：匿名子类把泛型参数写进了类签名，可通过 `getGenericSuperclass()` 读到。

### Q6. 通配符 `? extends T` 与 `? super T` 怎么选？（中级）

> 前置：泛型擦除、协变与逆变

**一句话结论**：遵循 PECS（Producer Extends, Consumer Super）：只读取（生产数据给你）用 `? extends T`，只写入（消费你给的数据）用 `? super T`，既要读又要写就不要用通配符。

**先把话说白**：`? extends T` 表示"某种 T 的子类型，但我不知道具体是哪个"。既然不知道具体类型，往里放任何东西都不安全，但取出来一定能当 T 用。`? super T` 相反：容器至少能装 T，所以放 T 及其子类安全，取出来只能当 Object 用。

**底层原理**：

1. **上界通配符的只读性。** `List<? extends Number> list`，编译器认为元素类型是 `capture of ? extends Number`，可能是 Integer 也可能是 Double，`list.add(1)` 无法通过编译（唯一例外是 `add(null)`）。读取时 `Number n = list.get(0)` 合法。

2. **下界通配符的只写性。** `List<? super Integer>`，可以 `add(1)`、`add(new Integer(2))`，因为容器保证能容纳 Integer；但 `get` 的静态类型只有 `Object`。

3. **JDK 源码中的印证。** `Collections.copy(List<? super T> dest, List<? extends T> src)`：src 是数据源（生产），dest 是目的地（消费）。`Collection.addAll(Collection<? extends E> c)` 同理。

4. **为什么需要通配符。** 泛型不变（invariant），`List<Integer>` 不是 `List<Number>`。但方法若只读取元素，接受 `List<? extends Number>` 就能同时兼容两者，提高了 API 的适用范围，同时用编译器保证了类型安全。

5. **返回值里不要用通配符。** 如果方法返回 `List<? extends T>`，调用方无法写入，API 变得难用。通配符应该出现在**入参**上，这是 Effective Java 的建议。

```java
static double sum(List<? extends Number> src) {   // 只读
    double s = 0;
    for (Number n : src) s += n.doubleValue();
    return s;
}
static void fill(List<? super Integer> dst, int n) { // 只写
    for (int i = 0; i < n; i++) dst.add(i);
}
```

**易混对比**：

| 写法 | 能读出的类型 | 能写入的类型 | 典型用途 |
| --- | --- | --- | --- |
| `List<T>` | T | T | 读写都要 |
| `List<? extends T>` | T | 除 null 外不可写 | 数据源、求和、遍历 |
| `List<? super T>` | Object | T 及其子类 | 数据目的地、收集结果 |
| `List<?>` | Object | 不可写 | 只做与类型无关的操作 |

**面试追问**：
- 追问：`List<?>` 与 `List<Object>` 一样吗？→ 答题要点：不一样，前者不可 add 任何非 null，后者可以 add 任意对象；`List<?>` 表示"某种未知类型的列表"。
- 追问：泛型为什么设计成不变的？→ 答题要点：若协变，`List<Integer>` 赋值给 `List<Number>` 后可 add Double，破坏类型安全，数组的协变正是历史教训。
- 追问：什么时候用 `T` 而不是通配符？→ 答题要点：类型参数需要在多处关联（入参与返回值、多个参数之间）时必须用 `T`。

### Q7. 异常体系怎么分层？checked 与 unchecked 该怎么选？（初级）

> 前置：异常继承体系、受检与非受检异常

**一句话结论**：`Throwable` 分 `Error` 与 `Exception`，`Exception` 再分受检异常（checked）与运行时异常（unchecked）。受检异常用于调用方可以恢复的外部故障，运行时异常用于编程错误；业务异常通常继承 `RuntimeException`。

**先把话说白**：受检异常是"编译器逼你处理"的异常，比如文件不存在、网络断了——这些是程序控制之外的意外，调用方理应准备 Plan B。运行时异常是"你写错了"，比如空指针、数组越界、参数非法，修代码才是解决办法，逼调用方 catch 没有意义。

**底层原理**：

1. **体系结构。** `Throwable` 下分 `Error`（`OutOfMemoryError`、`StackOverflowError`，JVM 层面问题，程序通常无力恢复）与 `Exception`。`Exception` 下 `RuntimeException` 及其子类是 unchecked，其余是 checked。

2. **编译器如何区分。** checked 异常靠方法签名上的 `throws` 声明传播，调用方必须 try-catch 或继续声明；unchecked 不受此约束，编译器不检查。

3. **异常表的实现。** 每个方法的字节码附带 `Exception table`，记录 `[start_pc, end_pc, handler_pc, catch_type]`。抛异常时 JVM 沿调用栈查找匹配的 handler，找到则跳转，找不到则弹出栈帧继续找。这也是异常开销的来源：填充栈轨迹（`fillInStackTrace`）要遍历栈帧。

4. **性能真相。** 创建异常对象并填充栈轨迹的开销远大于普通对象创建，但 try-catch 块本身在未抛异常时几乎零成本（只是元数据）。所以"用异常做流程控制"的问题在于**抛出的频率**，而不是 try 本身。

5. **工程实践。** 自定义业务异常继承 `RuntimeException`，携带错误码；不要吞异常（至少记录日志并保留 cause）；不要 `catch (Exception e) {}` 后什么都不做；转换异常时用 `new BizException(msg, e)` 保留异常链。

```java
public class BizException extends RuntimeException {
    private final String code;
    public BizException(String code, String msg, Throwable cause) {
        super(msg, cause);   // 保留 cause，避免异常链断裂
        this.code = code;
    }
}
```

**易混对比**：

| 维度 | checked | unchecked |
| --- | --- | --- |
| 代表 | `IOException`、`SQLException` | `NullPointerException`、`IllegalArgumentException` |
| 编译检查 | 强制处理 | 不强制 |
| 语义 | 外部可恢复故障 | 编程错误或不可恢复 |
| 在 lambda / 流中的表现 | 无法直接抛出，需要包装 | 无限制 |

**面试追问**：
- 追问：为什么 `SQLException` 是 checked，而 Spring 转成了 `DataAccessException`（unchecked）？→ 答题要点：checked 会污染层层签名，Spring 用模板方法统一转换，业务层不必关心具体数据库异常。
- 追问：`finally` 中抛异常会怎样？→ 答题要点：会覆盖 try 中的异常，原始异常丢失（除非用 try-with-resources 的 suppressed）。
- 追问：`Error` 能 catch 吗？→ 答题要点：语法可以，但通常不该；`OutOfMemoryError` 后 JVM 状态不可信。

### Q8. `try`/`catch`/`finally` 中 `return` 的执行顺序？finally 会改变返回值吗？（中级）

> 前置：栈帧、操作数栈、异常表

**一句话结论**：`finally` 一定执行（除非 `System.exit` 或 JVM 崩溃）；`return` 表达式先求值并暂存，再执行 `finally`，最后返回暂存值。因此在 `finally` 中修改基本类型局部变量不改变返回值，但修改引用对象的内部状态会生效，`finally` 中 `return` 则会覆盖前面的返回值。

**先把话说白**：`return` 在字节码里不是一条指令，而是"算好值 → 存到局部变量槽 → 跳去执行 finally → 回来取值返回"。所以你在 finally 里改的那个变量，和 return 已经存好的那份拷贝，是两个东西。

**底层原理**：

1. **编译后的结构。** `try { return x; } finally { ... }` 会被编译成：把 x 存入临时槽 → 执行 finally 代码 → 从临时槽取值 `ireturn`。若 finally 里有 `return`，则直接 `ireturn`，前面的值被丢弃。

2. **基本类型与引用类型的差异。** 基本类型存的是值的拷贝，finally 里 `x = 100` 改的是原变量，不影响已暂存的返回值。引用类型暂存的是引用地址的拷贝，finally 里 `obj.setX(1)` 修改堆中对象，返回值看到的自然是新状态。

3. **异常路径也会走 finally。** 若 try 中抛异常且 catch 未捕获，JVM 会先执行 finally 再向上抛。若 finally 也抛异常，原异常被覆盖——这是 try-with-resources 引入 `addSuppressed` 的原因。

4. **`finally` 中 return 的危害。** 它会把异常吞掉：try 中抛出异常，finally 里 return 会让方法正常返回，调用方完全不知道出过错。IDE 和静态检查工具都会告警。

```java
static int f() {
    int x = 1;
    try { return x; }        // 暂存 1
    finally { x = 100; }     // 改的是局部变量
}                            // 返回 1

static int g() {
    try { return 1; }
    finally { return 2; }    // 覆盖，返回 2
}
```

**易混对比**：

| 场景 | 返回值 | 原因 |
| --- | --- | --- |
| finally 修改基本类型局部变量 | 不变 | return 已暂存值拷贝 |
| finally 修改引用对象字段 | 改变 | 暂存的是引用，指向同一堆对象 |
| finally 中 return | 被覆盖 | finally 的 return 直接结束方法 |
| try 中抛异常 + finally return | 异常被吞 | 方法正常返回，异常丢失 |

**面试追问**：
- 追问：`try` 中 `System.exit(0)` 后 finally 还执行吗？→ 答题要点：不执行，JVM 直接退出，finally 没有机会运行。
- 追问：为什么阿里规约禁止在 finally 中使用 return？→ 答题要点：吞异常、覆盖返回值，排查困难。
- 追问：try-with-resources 的关闭顺序？→ 答题要点：逆序关闭，后声明的先关，异常以 suppressed 形式附加。

### Q9. try-with-resources 的原理？为什么它比手写 finally 更好？（中级）

> 前置：`AutoCloseable`、异常抑制

**一句话结论**：编译器把 try-with-resources 改写为 `try { ... } finally { if (res != null) res.close(); }` 的嵌套结构，并调用 `close()` 时把关闭异常通过 `addSuppressed` 附加到主异常上，保证原始异常不被覆盖、多个资源按逆序关闭。

**先把话说白**：手写 finally 关资源有两个经典坑：一是关闭时抛异常会把业务异常覆盖掉，二是多个资源要写一堆嵌套判空。try-with-resources 把这两件事交给编译器生成，代码短且异常信息完整。

**底层原理**：

1. **语法前提。** 资源必须实现 `AutoCloseable`（`Closeable` 是其子接口，`close` 抛 `IOException`）。JDK 7 引入该语法，JDK 9 起可以直接用已声明的 effectively final 变量。

2. **脱糖后的结构。** 编译器生成嵌套的 try-finally，每个资源一层；关闭前判空；关闭时的异常通过 `Throwable.addSuppressed` 挂到主异常上，主异常继续向外抛。

3. **异常传播规则。** try 块正常结束、close 抛异常 → 抛 close 的异常；try 块抛异常、close 也抛 → 抛 try 的异常，close 的进 suppressed；多个资源 close 都抛 → 先关的异常成为后关异常的 suppressed。

4. **与手写 finally 的对比。** 手写无法优雅处理"关闭异常覆盖业务异常"，需要在 finally 里再 try-catch，代码迅速膨胀；try-with-resources 由编译器保证，且顺序固定为逆序（符合资源依赖关系，后打开的先关闭）。

```java
try (Connection conn = ds.getConnection();
     PreparedStatement ps = conn.prepareStatement(SQL)) {
    ps.executeUpdate();
}   // 先关 ps，再关 conn；关闭异常进 suppressed
```

**易混对比**：

| 维度 | try-with-resources | 手写 finally |
| --- | --- | --- |
| 关闭顺序 | 逆序，自动 | 需手动保证 |
| 异常覆盖 | 用 suppressed 保留 | 容易覆盖主异常 |
| 代码量 | 少 | 资源多时嵌套深 |
| 资源泄漏 | 判空与关闭由编译器保证 | 容易漏写或提前 return 跳过 |

**面试追问**：
- 追问：如果 `close()` 里又抛异常，调用方看到几个异常？→ 答题要点：一个，主异常，其他在 `getSuppressed()` 里。
- 追问：为什么 `close` 声明的是 `Exception` 而不是 `IOException`？→ 答题要点：`AutoCloseable` 更通用，`Closeable` 才限定为 `IOException`。
- 追问：连接池的 `close()` 真的关闭连接吗？→ 答题要点：通常是归还连接，代理对象包装了真实连接，这也是"关闭"语义要小心的地方。

### Q10. 反射的原理与代价？动态代理有哪两种实现？（中级）

> 前置：`Class` 对象、类加载、代理模式

**一句话结论**：反射是运行时通过 `Class` 对象读取并操作类元数据（字段、方法、构造器、注解）的能力，代价是绕过编译期检查、无法内联、需要参数装箱与数组封装；动态代理在运行期生成代理类，JDK 代理基于接口 + `InvocationHandler`，CGLIB 基于继承 + 字节码生成子类。

**先把话说白**：正常调用是"编译器已经知道调哪个方法，直接生成一条 invoke 指令"；反射是"运行时才知道方法名，先去类元数据里查，再拼参数调用"。前者像按门牌号直接敲门，后者像到前台查登记簿再找人——灵活，但多了一道手续。

**底层原理**：

1. **Class 对象从哪来。** 三种方式：`类名.class`（编译期常量，不触发初始化）、`obj.getClass()`、`Class.forName("全限定名")`（默认触发初始化）。类加载后，方法区（元空间）中保存 `InstanceKlass` 结构，堆中有一个对应的 `java.lang.Class` 对象作为访问入口。

2. **反射调用的链路。** `Method.invoke` 先做访问权限检查（`setAccessible(true)` 可关闭），再把参数封装为 `Object[]`，最后走到 `MethodAccessor`。JDK 会先用 Native 版本调用，调用超过阈值（`-Dsun.reflect.inflationThreshold`，默认 15）后生成字节码版本的 accessor，避免每次都走 JNI。

3. **性能真相。** 现代 JDK 上反射调用与直接调用差距已缩小到数倍以内，真正的开销来自：参数数组分配、基本类型装箱、无法被 JIT 内联（多态 inline cache 不稳定）、权限检查。高频路径应缓存 `Method` 对象，或改用 `MethodHandle` / LambdaMetafactory。

4. **JDK 动态代理。** 要求目标类实现接口。`Proxy.newProxyInstance` 在运行期生成 `$Proxy0` 类，实现相同接口，每个方法体都调用 `InvocationHandler.invoke(proxy, method, args)`。因为是接口实现，所以只能代理接口方法，且生成类会缓存（按接口组合缓存）。

5. **CGLIB 动态代理。** 通过 ASM 生成目标类的子类，重写非 final 方法，方法内回调 `MethodInterceptor`。因此无法代理 final 类与 final/private 方法。Spring AOP 默认策略：有接口用 JDK 代理，无接口用 CGLIB；Spring Boot 2.x 起默认 `proxyTargetClass=true`，统一用 CGLIB。

```java
Object proxy = Proxy.newProxyInstance(
    target.getClass().getClassLoader(),
    target.getClass().getInterfaces(),
    (p, method, args) -> {
        long s = System.nanoTime();
        Object r = method.invoke(target, args);   // 反射调用真实方法
        System.out.println(method.getName() + " cost " + (System.nanoTime() - s));
        return r;
    });
```

**易混对比**：

| 维度 | JDK 动态代理 | CGLIB |
| --- | --- | --- |
| 前提 | 目标类必须实现接口 | 目标类不能是 final |
| 原理 | 生成实现同接口的代理类 | 生成子类并重写方法 |
| 方法范围 | 仅接口方法 | 非 final 的 public/protected 方法 |
| 依赖 | JDK 原生 | 第三方字节码库（Spring 已内嵌） |
| 性能 | 调用走反射，生成快 | 调用接近直接调用，生成慢 |

**面试追问**：
- 追问：`setAccessible(true)` 为什么能访问私有成员？→ 答题要点：关闭 Java 语言访问检查，受模块系统与 SecurityManager 约束。
- 追问：Spring 为什么同时支持两种代理？→ 答题要点：兼容无接口的类，同时避免 CGLIB 生成子类带来的 final 限制。
- 追问：反射会不会影响类卸载？→ 答题要点：会，`Method`/`Field` 持有 `Class` 引用，缓存不当会让类加载器无法回收（常见于热部署泄漏）。

### Q11. 深拷贝与浅拷贝的区别？怎么实现深拷贝？（中级）

> 前置：对象引用、`Cloneable`、序列化

**一句话结论**：浅拷贝只复制对象本身与其中的基本类型字段，引用字段仍指向同一对象；深拷贝递归复制所有引用对象，两个对象图完全独立。实现方式有重写 `clone` 逐层复制、序列化/反序列化、以及 JSON 序列化。

**先把话说白**：浅拷贝像复印一份通讯录，纸是新的，但上面写的"张三家的地址"还是同一个地址；深拷贝是把张三本人也复制一份。改原对象的引用字段，浅拷贝会跟着变，深拷贝不会。

**底层原理**：

1. **`Object.clone()` 的行为。** 它是 native 方法，按内存块复制，对引用字段只复制引用值——这就是浅拷贝。使用前类必须实现 `Cloneable`，否则抛 `CloneNotSupportedException`（这是 Java 设计上被诟病的地方，`Cloneable` 只是个标记接口，没有 `clone` 方法）。

2. **逐层 clone 的写法。** 先 `super.clone()` 得到浅拷贝，再对每个可变引用字段单独 `clone` 并赋值。缺点是每个类都要实现，遇到循环引用会栈溢出，遇到 final 字段无法赋值。

3. **序列化实现。** 对象图整体写出再读回，天然深拷贝，能处理循环引用（靠引用句柄表），但要求所有对象可序列化，性能较差（尤其 Java 原生序列化）。

4. **JSON 序列化。** 最常用（Jackson、Fastjson），代码最简，但会丢失类型信息（泛型、多态子类）、忽略 transient、日期格式可能变、无法处理循环引用（需配置）。

5. **拷贝构造器 / 静态工厂。** Effective Java 推荐的方式：`new User(other)`，显式可控、无反射、无序列化开销，但要手写且需维护。

```java
// 逐层 clone
@Override public Object clone() throws CloneNotSupportedException {
    User u = (User) super.clone();          // 浅拷贝
    u.tags = new ArrayList<>(this.tags);    // 可变引用单独复制
    return u;
}
```

**易混对比**：

| 方式 | 是否深拷贝 | 性能 | 限制 |
| --- | --- | --- | --- |
| `Object.clone()` | 浅 | 高 | 需实现 Cloneable，逐层处理 |
| 手写 clone 链 | 深 | 高 | 代码多，循环引用难处理 |
| Java 序列化 | 深 | 低 | 必须 Serializable |
| JSON 序列化 | 深 | 中 | 丢泛型/多态信息，循环引用需配置 |
| 拷贝构造器 | 可控 | 高 | 需手写维护 |

**面试追问**：
- 追问：`String` 需要深拷贝吗？→ 答题要点：不需要，不可变对象共享安全。
- 追问：为什么 `Cloneable` 是空接口？→ 答题要点：标记接口，指示 `Object.clone` 允许按字段复制，属于早期设计遗留。
- 追问：BeanUtils.copyProperties 是深拷贝吗？→ 答题要点：浅拷贝，嵌套对象仍共享引用，这是生产事故高发点。

### Q12. `static`、`final`、初始化顺序，类的加载与初始化何时触发？（中级）

> 前置：类加载、初始化顺序

**一句话结论**：`static` 成员属于类、在类初始化阶段执行且只执行一次；`final` 表示不可变（引用不可变，对象内容不一定）；类初始化的触发条件是首次主动使用（new、访问静态字段/方法、反射、子类初始化），且严格按"父类静态 → 子类静态 → 父类实例 → 子类实例"的顺序。

**先把话说白**：类加载分"加载—验证—准备—解析—初始化"五步，`static` 代码在最后一步"初始化"才跑。JVM 保证每个类只初始化一次，靠的是 `Class` 对象上的状态标记加锁。很多人搞不清顺序，本质是没把"静态属于类、实例属于对象"这条线划清。

**底层原理**：

1. **准备阶段 vs 初始化阶段。** 准备阶段给静态变量分配内存并赋**零值**（`int` 为 0，引用为 null），`final static` 常量若为编译期常量则直接赋真实值（放入常量池）。初始化阶段才执行 `<clinit>()`，即静态变量赋值与静态代码块，按源码顺序合并执行。

2. **`<clinit>` 的线程安全。** JVM 保证 `<clinit>` 加锁执行，多线程同时触发只有一个线程执行，其余阻塞。这也是"静态内部类单例"能实现懒加载且线程安全的原因。

3. **实例初始化顺序。** 分配内存并赋零值 → 调用父类构造器 → 执行本类实例初始化（字段赋值与实例代码块按源码顺序）→ 执行本类构造器剩余代码。所以"父类构造器中调用被子类重写的方法"会看到子类字段还是零值，这是一个经典陷阱。

4. **主动使用 vs 被动使用。** 主动使用包括：`new`、访问静态字段（非 final 常量）、调用静态方法、反射 `Class.forName`、初始化子类、作为启动类。被动使用不触发初始化：通过子类访问父类静态字段（只初始化父类）、`ClassLoader.loadClass`、定义数组。

5. **`static final` 常量的特殊性。** 编译期常量在编译时被内联到调用方字节码，改常量值需要重新编译调用方，否则仍是旧值——这是"改配置不生效"的经典原因。

```java
class Parent {
    static { System.out.println("1 parent static"); }
    { System.out.println("3 parent instance"); }
    Parent() { System.out.println("4 parent ctor"); }
}
class Child extends Parent {
    static { System.out.println("2 child static"); }
    { System.out.println("5 child instance"); }
    Child() { System.out.println("6 child ctor"); }
}
new Child(); // 1 2 3 4 5 6
```

**易混对比**：

| 修饰符 | 作用对象 | 关键语义 | 常见误用 |
| --- | --- | --- | --- |
| `static` | 成员/方法/代码块 | 属于类，全类共享 | 静态字段持有大对象导致类加载器泄漏 |
| `final` | 类/方法/字段 | 不可继承/不可重写/不可重新赋值 | 以为 final 对象内容不可变 |
| `static final` | 常量 | 编译期常量会被内联 | 改值后调用方未重编译 |

**面试追问**：
- 追问：静态方法能被重写吗？→ 答题要点：不能，只能隐藏，按声明类型调用。
- 追问：为什么静态内部类单例是懒加载的？→ 答题要点：外部类初始化不会初始化内部类，首次调用 `getInstance` 才触发 `<clinit>`。
- 追问：父类构造器里调用被子类重写的方法有什么问题？→ 答题要点：子类字段尚未初始化，读到 null/0，可能 NPE。

### Q13. BIO、NIO、AIO 的区别？多路复用解决了什么问题？（中级）

> 前置：阻塞与非阻塞、内核缓冲区

**一句话结论**：BIO 是"一连接一线程"的阻塞模型，连接数受线程数限制；NIO 基于 Channel + Buffer + Selector，用一个线程监听多个连接的就绪事件，实现非阻塞；AIO 是内核完成读写后再回调，进一步省去应用层轮询。多路复用解决的是"用少量线程管理大量连接"的问题。

**先把话说白**：BIO 像每个客人配一个服务员，客人不说话服务员就一直等着；NIO 像一个服务员在大厅里转，谁举手就去谁那儿；AIO 像客人点完单，厨房做好了直接送到桌上，服务员不用管过程。

**底层原理**：

1. **BIO 的成本模型。** `accept()` 阻塞、`read()` 阻塞。每个连接一个线程，线程栈默认 1MB（`-Xss`），万级连接就是万级线程，上下文切换与内存开销不可接受。可以通过线程池缓解，但慢连接仍会占满线程。

2. **NIO 的三个核心组件。** `Channel`（双向，可读写）、`Buffer`（数据容器，flip/clear 切换读写模式）、`Selector`（多路复用器，注册 Channel 的 `OP_ACCEPT/OP_READ/OP_WRITE` 事件）。一个 Selector 线程轮询就绪事件，事件驱动处理，避免为每个连接阻塞。

3. **非阻塞不等于异步。** NIO 的读写仍需应用线程执行，只是"没数据就返回 0"不阻塞；AIO（NIO.2）由内核完成读写后回调 `CompletionHandler`，应用线程完全不参与等待。Linux 上 AIO 实现不成熟，主流框架仍用 epoll + NIO。

4. **多路复用的本质。** 把"每个连接一次系统调用等待"变成"一次系统调用返回多个就绪连接"，减少用户态/内核态切换次数。epoll 用红黑树管理 fd、就绪链表返回结果，复杂度 O(1)（就绪数），而 select 是 O(n) 且受 1024 fd 限制。

5. **Reactor 模式。** 单 Reactor 单线程（Redis 6.0 前的网络模型）→ 单 Reactor 多线程（Netty 的 Boss/Worker）→ 主从 Reactor（Boss 只负责 accept）。Netty 的 `EventLoop` 绑定固定线程，一个 Channel 的所有事件在同一线程处理，天然避免并发问题。

**易混对比**：

| 模型 | 阻塞点 | 线程模型 | 适用场景 |
| --- | --- | --- | --- |
| BIO | accept/read 阻塞 | 一连接一线程 | 连接少、逻辑简单 |
| NIO | 无（Selector 阻塞） | 少量线程管多连接 | 高并发长连接，如 IM、网关 |
| AIO | 无 | 回调线程池 | 连接多且 IO 耗时，Linux 支持有限 |

**面试追问**：
- 追问：Netty 为什么不用 AIO？→ 答题要点：Linux 原生 AIO 不成熟、跨平台差异大，epoll 足够高效且可控。
- 追问：Selector 空轮询问题是什么？→ 答题要点：epoll 的 bug 导致 select 立即返回 0，Netty 用计数 + 重建 Selector 规避。
- 追问：NIO 一定比 BIO 快吗？→ 答题要点：不一定，连接数少时 BIO 更简单，NIO 的复杂度与调试成本更高。

### Q14. select / poll / epoll 的差异？水平触发与边缘触发？（高级）

> 前置：文件描述符、就绪事件、内核回调

**一句话结论**：select 用位图传递 fd 集合、有 1024 上限、每次调用都要全量拷贝并 O(n) 扫描；poll 用数组去掉上限但仍需全量扫描；epoll 用红黑树注册 fd、内核就绪链表回调通知，只返回就绪的 fd，复杂度与连接总数无关。水平触发（LT）只要缓冲区有数据就持续通知，边缘触发（ET）只在状态变化时通知一次，必须一次读到 `EAGAIN`。

**先把话说白**：select/poll 像每次问前台"有哪些人有信"，前台把整个名单过一遍；epoll 像在前台登记"有信就叫我"，只有真有信时才通知你，且只告诉你谁来信了。

**底层原理**：

1. **select 的三重开销。** 每次调用把 fd 集合从用户态拷贝到内核态；内核线性扫描所有 fd 检查就绪；返回后用户态还要再扫描一遍找出就绪的 fd。fd 用 `fd_set` 位图表示，`FD_SETSIZE` 默认 1024。

2. **poll 的改进与局限。** 用 `pollfd` 数组替代位图，没有数量上限，但拷贝与 O(n) 扫描依旧，且每次调用都要重新传入整个数组。

3. **epoll 的三个系统调用。** `epoll_create` 创建实例（内核中用红黑树存 fd + 就绪链表）；`epoll_ctl` 增删改关注的事件，只在注册时拷贝一次；`epoll_wait` 直接返回就绪链表中的 fd，无需扫描全量。回调机制：网卡中断 → 协议栈处理 → 唤醒等待队列 → 把 fd 加入就绪链表。

4. **LT 与 ET。** LT 是默认模式，只要 fd 可读且没被读完，下次 `epoll_wait` 还会返回；ET 只在"不可读变为可读"时通知一次，因此必须循环 `read` 直到返回 `EAGAIN`，否则剩余数据可能永远不再触发通知。ET 减少了系统调用次数，但编程要求更高，Netty 默认用 ET（Linux 上）。

5. **epoll 的边界。** 并非所有 fd 都支持（普通文件不支持，总是就绪）；跨进程共享 epoll 实例需要特殊处理；海量空闲连接时红黑树内存占用也要考虑。

```c
int ep = epoll_create1(0);
struct epoll_event ev = { .events = EPOLLIN | EPOLLET, .data.fd = fd };
epoll_ctl(ep, EPOLL_CTL_ADD, fd, &ev);
struct epoll_event events[1024];
int n = epoll_wait(ep, events, 1024, -1);   // 只返回就绪的 fd
```

**易混对比**：

| 维度 | select | poll | epoll |
| --- | --- | --- | --- |
| fd 上限 | 1024（FD_SETSIZE） | 无 | 无（受内存限制） |
| 数据结构 | 位图 | 数组 | 红黑树 + 就绪链表 |
| 拷贝开销 | 每次全量 | 每次全量 | 注册时一次 |
| 扫描复杂度 | O(n) | O(n) | O(就绪数) |
| 触发模式 | LT | LT | LT / ET |

**面试追问**：
- 追问：ET 模式下为什么必须读到 `EAGAIN`？→ 答题要点：只通知一次，不读完就不会再触发，数据滞留。
- 追问：epoll 一定比 select 快吗？→ 答题要点：连接数少且都活跃时差别不大，优势在大量连接且少量活跃。
- 追问：Redis 为什么用单线程 + epoll 还这么快？→ 答题要点：纯内存操作、避免锁竞争、命令执行本身极快，瓶颈在内存与网络而非 CPU。

### Q15. 零拷贝是什么？`mmap` 与 `sendfile` 分别省了什么？（高级）

> 前置：用户态与内核态、DMA、页缓存

**一句话结论**：零拷贝指减少数据在用户态与内核态之间的复制次数与上下文切换。传统 `read + write` 要 4 次拷贝、4 次切换；`mmap + write` 省掉一次内核到用户的拷贝；`sendfile` 让数据在内核态直接从页缓存送到网卡，配合 DMA 收集可实现 CPU 零拷贝。

**先把话说白**：读文件再发网络，朴素做法是"磁盘 → 内核缓冲区 → 用户缓冲区 → socket 缓冲区 → 网卡"，数据被搬了四趟。可应用其实不需要看这些数据，只是想转发，那为什么非要搬到用户态？零拷贝就是把这段冤枉路砍掉。

**底层原理**：

1. **传统模型的四次拷贝。** DMA 把磁盘数据拷到内核页缓存（1）；CPU 拷到用户缓冲区（2）；`write` 时 CPU 拷到 socket 缓冲区（3）；DMA 拷到网卡（4）。伴随 4 次用户态/内核态切换。

2. **`mmap + write`。** 把内核页缓存映射到用户地址空间，用户态"看到"数据但不需要拷贝，省掉第 2 次拷贝，只剩 3 次。适合需要对数据做少量修改的场景。缺点是映射建立/销毁有开销，且文件被截断时访问会触发 `SIGBUS`。

3. **`sendfile`。** 数据全程留在内核：磁盘 → 页缓存 → socket 缓冲区 → 网卡。省掉用户态参与，切换降为 2 次。带 `DMA gather` 的 `sendfile` 可让网卡直接按描述符从页缓存取数据，CPU 完全不参与拷贝（真正的零拷贝）。

4. **`splice` 与 `tee`。** Linux 2.6.17 引入，通过管道在两个 fd 之间移动数据，不经过用户态，适合代理转发场景。

5. **谁在用。** Kafka 用 `sendfile`（更准确地说是 `FileChannel.transferTo`）把日志段发给消费者；Netty 的 `FileRegion` 基于 `transferTo`；Nginx 静态文件服务默认开启 `sendfile on`。注意：需要应用层处理数据（如压缩、加密）时零拷贝就用不上。

```java
try (FileChannel in = FileChannel.open(path);
     SocketChannel out = SocketChannel.open(addr)) {
    in.transferTo(0, in.size(), out);   // 底层走 sendfile
}
```

**易混对比**：

| 方式 | 拷贝次数 | 上下文切换 | 适用场景 |
| --- | --- | --- | --- |
| read + write | 4 | 4 | 需要对数据加工 |
| mmap + write | 3 | 4 | 大文件、少量修改 |
| sendfile | 3（DMA gather 时 2） | 2 | 纯转发，如 Kafka、Nginx |
| splice | 2 | 2 | 管道转发、代理 |

**面试追问**：
- 追问：Kafka 为什么快？零拷贝占多大比重？→ 答题要点：顺序写 + 页缓存 + 批量 + 零拷贝 + 分区并行，零拷贝只解决网络发送段。
- 追问：零拷贝需要几次上下文切换？→ 答题要点：`sendfile` 2 次（发起调用、返回），传统 4 次。
- 追问：mmap 会有什么问题？→ 答题要点：页表开销、文件截断触发 SIGBUS、脏页回写不可控。

### Q16. `final`、`finally`、`finalize` 有什么区别？（初级）

> 前置：修饰符语义、对象回收流程

**一句话结论**：`final` 是修饰符，表示类不可继承、方法不可重写、字段不可重新赋值；`finally` 是异常处理块，无论是否抛异常都会执行；`finalize` 是 `Object` 的方法，在对象被回收前由 GC 调用一次，JDK 9 起标记废弃，不应使用。

**先把话说白**：三个词长得像，但完全不是一个层面的东西：一个是"不能改"，一个是"一定会执行"，一个是"临死前说句话"。面试官问这题，主要是看你会不会把这三个混为一谈。

**底层原理**：

1. **`final` 的三个位置。** 修饰类 → 不能被继承（如 `String`）；修饰方法 → 不能被重写（也便于 JIT 内联，虽然现代 JIT 靠类型剖面也能优化）；修饰字段 → 只能赋值一次（声明时、构造器中、实例初始化块中）。`final` 引用不可变，但对象内部状态可变。

2. **`final` 的内存语义。** JMM 保证 final 字段的初始化在构造器返回前完成，其他线程看到引用时一定能看到正确的 final 字段值，不需要额外同步。这是"安全发布"的一种形式。

3. **`finally` 的执行保证。** 由字节码的异常表与编译器插入的跳转保证，正常路径、异常路径、`break/continue/return` 都会经过。唯一不执行的情况是 JVM 退出（`System.exit`、`Runtime.halt`）或进程被杀。

4. **`finalize` 为什么被废弃。** 执行时机不确定（可能永远不执行）、拖慢 GC（需要额外的 Finalizer 线程与队列）、可能让对象"复活"、异常被吞。替代方案是 `try-with-resources`、`Cleaner`（JDK 9）或显式 `close()`。

**易混对比**：

| 关键字 | 类别 | 作用 | 现状 |
| --- | --- | --- | --- |
| `final` | 修饰符 | 不可继承/重写/重新赋值 | 常用 |
| `finally` | 语法块 | 必定执行的清理逻辑 | 常用，配合 try |
| `finalize` | 方法 | 回收前回调 | JDK 9 废弃，禁止使用 |

**面试追问**：
- 追问：`final` 字段一定在构造器中赋值吗？→ 答题要点：可以在声明处、实例初始化块或构造器中，但必须保证每条构造路径都赋值。
- 追问：`finalize` 能用来释放连接吗？→ 答题要点：不能，时机不确定，连接池会耗尽。
- 追问：`finally` 里能写 `return` 吗？→ 答题要点：能编译但禁止，会吞异常、覆盖返回值。

### Q17. 什么是 SPI？JDK 的 SPI 与 Dubbo 的 SPI 差在哪？（高级）

> 前置：接口与实现分离、类加载器、Dubbo 扩展点

**一句话结论**：SPI（Service Provider Interface）是"接口定义方与实现方分离"的扩展机制，JDK 通过 `META-INF/services/接口全限定名` 文件加载实现类；Dubbo 的 SPI 增强了按 key 加载、IOC/AOP 包装与自适应扩展，解决了 JDK SPI 一次性加载全部实现、无法按需选择的问题。

**先把话说白**：框架定义一个接口，具体实现由第三方 jar 提供，框架运行时才发现"哦，原来有这么一个实现"。JDBC 驱动就是典型：你只写 `DriverManager.getConnection`，MySQL 的驱动 jar 里通过 SPI 注册了 `Driver` 实现。

**底层原理**：

1. **JDK SPI 的加载流程。** `ServiceLoader.load(Interface.class)` 扫描所有 jar 的 `META-INF/services/<接口全限定名>` 文件，逐行读取实现类名，用 `Class.forName` 加载并实例化（要求无参构造）。

2. **JDK SPI 的三个缺陷。** 一次性实例化所有实现，无法按需选择；没有 key 概念，只能按类型取；不支持依赖注入与包装。所以 Dubbo 自己实现了一套。

3. **Dubbo SPI 的设计。** 配置文件放在 `META-INF/dubbo/` 等目录，格式为 `key=实现类全限定名`；`ExtensionLoader.getExtension("key")` 按名加载并缓存；支持 `@Adaptive` 生成自适应扩展（运行时根据 URL 参数选择实现）、`@Activate` 自动激活、`Wrapper` 类实现 AOP、`setter` 注入实现 IOC。

4. **Java 模块化后的变化。** JDK 9 引入模块系统，SPI 需要用 `provides ... with ...` 在 `module-info.java` 中声明，`ServiceLoader` 依然是入口。

5. **实际用途。** JDBC 驱动、SLF4J 日志实现绑定、Spring Boot 的 `spring.factories`（Spring Boot 3 改为 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`）、Dubbo 扩展点。

```java
ServiceLoader<Driver> loader = ServiceLoader.load(Driver.class);
for (Driver d : loader) { ... }   // 遍历所有实现，全部实例化
```

**易混对比**：

| 维度 | JDK SPI | Dubbo SPI |
| --- | --- | --- |
| 配置位置 | `META-INF/services/` | `META-INF/dubbo/` 等 |
| 加载方式 | 全部加载 | 按 key 懒加载并缓存 |
| 选择能力 | 无 | 按名称/自适应/激活 |
| 扩展能力 | 无 | IOC、AOP 包装、自适应 |

**面试追问**：
- 追问：Spring Boot 自动配置和 SPI 什么关系？→ 答题要点：本质是 SPI 思想，Spring Boot 2.x 用 `spring.factories`，3.x 用 `AutoConfiguration.imports`。
- 追问：JDK SPI 会有什么问题？→ 答题要点：全部实例化、无法按需、类加载器泄漏（Thread Context ClassLoader 使用不当）。
- 追问：为什么 SPI 要用线程上下文类加载器？→ 答题要点：父加载器无法看到子加载器中的实现类，需要打破双亲委派。

### Q18. Java 是值传递还是引用传递？（初级）

> 前置：栈帧、引用副本

**一句话结论**：Java 只有值传递。基本类型传的是值的副本，引用类型传的是引用地址的副本；方法内可以修改引用指向对象的内部状态，但无法让原引用指向新对象。

**先把话说白**：把对象传给方法，传的是"钥匙的复印件"，不是"把钥匙给你"。你可以用复印件开门进屋搬东西（改对象状态），但你把复印件换成另一把钥匙，屋主手里的原钥匙不受影响。

**底层原理**：

1. **形参与实参。** 方法调用时，实参的值被复制到形参的局部变量槽。基本类型复制数值，引用类型复制 4/8 字节的引用值。

2. **为什么看起来像引用传递。** 因为副本和原引用指向同一个堆对象，通过副本修改对象字段，原引用能看到变化。但这不叫引用传递——引用传递是指形参与实参是同一个变量。

3. **经典反例。** `void swap(User a, User b)` 交换两个引用，方法外无效，因为交换的只是局部副本。而 `a.setName("x")` 在方法外可见。

4. **数组与包装类同理。** 数组是对象，传的是引用副本；`String`、`Integer` 不可变，方法内"修改"实际是重新赋值局部变量，外部无感。

```java
static void change(StringBuilder sb, String s) {
    sb.append("b");   // 生效，改的是同一对象
    s = "new";        // 无效，只改了局部副本
}
```

**面试追问**：
- 追问：为什么很多人说是"传引用"？→ 答题要点：混淆了"传递引用的值"与"引用传递"，关键是形参是否为实参的别名。
- 追问：如何实现类似 swap 的效果？→ 答题要点：返回新对象、用数组/持有者对象包装，或直接交换对象内部字段。

## 五、本章速记卡

- `String` 不可变三收益：线程安全、hash 可缓存、常量池复用；JDK 9 起 `byte[] + coder`。
- `intern()` 返回池中引用；JDK 7 后池在堆中，登记的是堆对象引用。
- `equals` 相等 ⇒ `hashCode` 必相等；反之不成立。散列表先 hash 后 equals。
- `Integer` 缓存 -128~127，区间内 `==` 为 true。
- 重载编译期静态分派，重写运行期 vtable 动态分派；`final/private/static` 不走动态分派。
- 接口可多实现、无状态；抽象类可承载状态与模板方法。
- 泛型擦除到上界；桥方法解决重写签名不一致；不能 `new T[]`、不能 `instanceof T`。
- PECS：生产者 extends，消费者 super。
- checked 用于可恢复外部故障，unchecked 用于编程错误；业务异常继承 `RuntimeException`。
- `finally` 必定执行；`finally` 中 `return` 会覆盖返回值并吞异常。
- try-with-resources 逆序关闭，异常进 `suppressed`。
- JDK 代理靠接口，CGLIB 靠继承；Spring Boot 2.x 起默认 CGLIB。
- 深拷贝三法：逐层 clone、序列化、JSON；`BeanUtils.copyProperties` 是浅拷贝。
- 类初始化顺序：父静态 → 子静态 → 父实例 → 父构造 → 子实例 → 子构造。
- BIO 一连接一线程；NIO 靠 Selector；多路复用把 O(n) 等待变成一次系统调用。
- epoll = 红黑树 + 就绪链表；ET 必须读到 `EAGAIN`。
- 零拷贝：`sendfile` 省掉用户态拷贝，DMA gather 实现 CPU 零拷贝。
- `final` 修饰符，`finally` 代码块，`finalize` 已废弃。
- Java 只有值传递，引用类型传的是引用副本。

## 六、本章自测清单

1. 不看资料，画出 `new String("abc")` 在堆与常量池中的对象分布，并说明创建了几个对象。
2. 解释为什么重写 `equals` 必须重写 `hashCode`，并举一个"存进去取不出来"的具体例子。
3. 说出 `invokevirtual` 查 vtable 的完整过程，并解释 `invokeinterface` 为什么更复杂。
4. 用 PECS 解释 `Collections.copy` 的两个参数为什么一个 extends 一个 super。
5. 写出 `try { return x; } finally { x = 100; }` 的字节码执行顺序，并说明引用类型为何不同。
6. 说明 JDK 动态代理与 CGLIB 的适用边界，以及 Spring 如何选择。
7. 画出 select / poll / epoll 的数据结构与调用流程差异，并说明 ET 模式为什么要读到 `EAGAIN`。
8. 解释 `sendfile` 相比 `read + write` 少了几次拷贝、几次上下文切换。
