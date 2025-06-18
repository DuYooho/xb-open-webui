FROM nvidia/cuda:12.4.1-cudnn-devel-ubuntu22.04

# 设置时区和非交互式安装
ENV DEBIAN_FRONTEND=noninteractive
RUN ln -fs /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

# 第一阶段：临时使用http镜像源安装ca-certificates
RUN sed -i "s@http://.*archive.ubuntu.com@http://mirrors.aliyun.com@g" /etc/apt/sources.list && \
    sed -i "s@http://.*security.ubuntu.com@http://mirrors.aliyun.com@g" /etc/apt/sources.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates && \
    update-ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# 第二阶段：切换回https镜像源
RUN sed -i "s@http://mirrors.aliyun.com@https://mirrors.aliyun.com@g" /etc/apt/sources.list && \
    apt-get update


# 安装基本工具和依赖
RUN apt-get update && apt-get install -y \
    tmux \
    sudo \
    curl \
    iputils-ping \
    openssh-server \
    vim \
    wget \
    curl \
    git \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    locales \
    net-tools \
    htop \
    proxychains4 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 配置SSH
RUN mkdir /var/run/sshd && \
    echo 'root:password' | chpasswd && \
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config

# 配置pip南科大镜像(直接写入pip.conf)
RUN mkdir -p /root/.config/pip && \
    echo "[global]" > /root/.config/pip/pip.conf && \
    echo "index-url = https://mirrors.sustech.edu.cn/pypi/web/simple" >> /root/.config/pip/pip.conf && \
    echo "trusted-host = mirrors.sustech.edu.cn" >> /root/.config/pip/pip.conf && \
    echo "timeout = 600" >> /root/.config/pip/pip.conf

# Copy requirements.txt and install Python packages
COPY requirements.txt /tmp/requirements.txt
RUN pip3 install --no-cache-dir -r /tmp/requirements.txt && \
    rm /tmp/requirements.txt

# Clean all caches
RUN apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* ~/.cache/pip

# Expose all ports (0-65535)
EXPOSE 0-65535

